import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseCardSearch, formatCollectorNumber } from "@/lib/cardUtils";

export type MarketTab = "popular" | "most_listed" | "lowest_price" | "highest_price";

export interface MarketplaceFilters {
  search: string;
  tab: MarketTab;
  sets: string[];
  rarities: string[];
  supertypes: string[];
  priceMin: number | null;
  priceMax: number | null;
  onlyWithListings: boolean;
  page: number;
  pageSize: number;
}

export interface MarketCard {
  id: string;
  name: string;
  number: string | null;
  rarity: string | null;
  supertype: string | null;
  types: string[] | null;
  image_small: string | null;
  image_ptbr: string | null;
  set_id: string | null;
  set_name: string | null;
  printed_total: number | null;
  display_number: string;
  active_listings: number;
  min_price_cents: number | null;
  score_popular: number;
}

export function useMarketplace(filters: MarketplaceFilters) {
  return useQuery({
    queryKey: ["marketplace", filters],
    queryFn: async () => {
      const client = supabase as any;

      // 1) Get market stats for all cards with active listings
      // Fetch ALL market stats (paginate to bypass 1000-row PostgREST limit)
      let allStats: any[] = [];
      let statsPage = 0;
      const statsPageSize = 1000;
      while (true) {
        const { data: batch, error: statsErr } = await client
          .from("card_market_stats")
          .select("card_id, offers_count, min_price_cents")
          .range(statsPage * statsPageSize, (statsPage + 1) * statsPageSize - 1);
        if (statsErr) throw statsErr;
        if (!batch || batch.length === 0) break;
        allStats = allStats.concat(batch);
        if (batch.length < statsPageSize) break;
        statsPage++;
      }

      const statsMap = new Map<string, { offers: number; minPrice: number | null }>();
      for (const s of allStats) {
        statsMap.set(s.card_id, { offers: s.offers_count || 0, minPrice: s.min_price_cents });
      }

      // 2) Get analytics for popularity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: viewsRaw } = await client
        .from("analytics_events")
        .select("entity_id")
        .eq("event_name", "view_card_market")
        .gte("created_at", sevenDaysAgo);
      const { data: clicksRaw } = await client
        .from("analytics_events")
        .select("entity_id")
        .eq("event_name", "click_buy_now")
        .gte("created_at", sevenDaysAgo);

      const viewsCount = new Map<string, number>();
      for (const v of viewsRaw || []) {
        viewsCount.set(v.entity_id, (viewsCount.get(v.entity_id) || 0) + 1);
      }
      const clicksCount = new Map<string, number>();
      for (const c of clicksRaw || []) {
        clicksCount.set(c.entity_id, (clicksCount.get(c.entity_id) || 0) + 1);
      }

      // 3) Get cards with sets
      let query = client
        .from("cards")
        .select("id, name, number, rarity, supertype, types, image_small, image_ptbr, set_id, sets(name, printed_total, total)")
        .order("name")
        .limit(1000);

      if (filters.search) {
        const parsed = parseCardSearch(filters.search);
        switch (parsed.kind) {
          case "exact_number":
            query = query.eq("number", parsed.number);
            break;
          case "prefix_number":
            query = query.eq("number", parsed.number);
            break;
          case "plain_number":
            query = query.eq("number", parsed.number);
            break;
          case "text":
            if (parsed.query) {
              query = query.or(`name.ilike.%${parsed.query}%`);
            }
            break;
        }
      }
      if (filters.sets.length > 0) {
        query = query.in("set_id", filters.sets);
      }
      if (filters.rarities.length > 0) {
        query = query.in("rarity", filters.rarities);
      }
      if (filters.supertypes.length > 0) {
        query = query.in("supertype", filters.supertypes);
      }

      const { data: cardsRaw, error: cardsErr } = await query;
      if (cardsErr) throw cardsErr;

      // 4) Map and enrich
      let cards: MarketCard[] = (cardsRaw || []).map((row: any) => {
        const setData = Array.isArray(row.sets) ? row.sets[0] : row.sets;
        const printedTotal = setData?.printed_total ?? setData?.total ?? null;
        const displayNumber = formatCollectorNumber(row.number, printedTotal);

        const stat = statsMap.get(row.id);
        const activeListings = stat?.offers || 0;
        const minPrice = stat?.minPrice ?? null;
        const views7d = viewsCount.get(row.id) || 0;
        const clicks7d = clicksCount.get(row.id) || 0;
        // score_popular = (active_listings * 2) + (views_7d * 1) + (buy_clicks_7d * 3)
        const scorePopular = (activeListings * 2) + (views7d * 1) + (clicks7d * 3);

        return {
          id: row.id,
          name: row.name,
          number: row.number,
          rarity: row.rarity,
          supertype: row.supertype,
          types: row.types,
          image_small: row.image_small,
          image_ptbr: row.image_ptbr,
          set_id: row.set_id,
          set_name: setData?.name || null,
          printed_total: printedTotal,
          display_number: displayNumber,
          active_listings: activeListings,
          min_price_cents: minPrice,
          score_popular: scorePopular,
        };
      });

      // 5) Apply client-side filters
      // For exact number search (e.g. "071/182"), filter by printed_total too
      if (filters.search) {
        const parsed = parseCardSearch(filters.search);
        if (parsed.kind === "exact_number") {
          cards = cards.filter((c) => c.printed_total === parsed.total);
        }
      }
      if (filters.onlyWithListings) {
        cards = cards.filter((c) => c.active_listings > 0);
      }
      if (filters.priceMin != null) {
        const minCents = filters.priceMin * 100;
        cards = cards.filter((c) => c.min_price_cents != null && c.min_price_cents >= minCents);
      }
      if (filters.priceMax != null) {
        const maxCents = filters.priceMax * 100;
        cards = cards.filter((c) => c.min_price_cents != null && c.min_price_cents <= maxCents);
      }

      // 6) Sort by tab (with tiebreakers)
      const nameTie = (a: MarketCard, b: MarketCard) => a.name.localeCompare(b.name);
      switch (filters.tab) {
        case "popular":
          cards.sort((a, b) => b.score_popular - a.score_popular || b.active_listings - a.active_listings || nameTie(a, b));
          break;
        case "most_listed":
          cards.sort((a, b) => b.active_listings - a.active_listings || (a.min_price_cents ?? Infinity) - (b.min_price_cents ?? Infinity) || nameTie(a, b));
          break;
        case "lowest_price":
          cards.sort((a, b) => (a.min_price_cents ?? Infinity) - (b.min_price_cents ?? Infinity) || nameTie(a, b));
          break;
        case "highest_price":
          cards.sort((a, b) => (b.min_price_cents ?? 0) - (a.min_price_cents ?? 0) || nameTie(a, b));
          break;
      }

      // 7) Paginate
      const total = cards.length;
      const start = filters.page * filters.pageSize;
      const paged = cards.slice(start, start + filters.pageSize);

      return { cards: paged, total, totalPages: Math.ceil(total / filters.pageSize) };
    },
    staleTime: 30_000,
  });
}

export function useFilterOptions() {
  const setsQuery = useQuery({
    queryKey: ["marketplace-filter-sets"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("sets").select("id, name").order("name");
      return data || [];
    },
    staleTime: 60_000 * 5,
  });

  const raritiesQuery = useQuery({
    queryKey: ["marketplace-filter-rarities"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("cards")
        .select("rarity")
        .not("rarity", "is", null)
        .limit(1000);
      const unique = [...new Set((data || []).map((d: any) => d.rarity).filter(Boolean))].sort();
      return unique as string[];
    },
    staleTime: 60_000 * 5,
  });

  return { sets: setsQuery.data || [], rarities: raritiesQuery.data || [] };
}
