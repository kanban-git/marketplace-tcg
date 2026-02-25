import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseCardSearch, formatCollectorNumber, formatCardSubtitle } from "@/lib/cardUtils";

export interface Card {
  id: string;
  set_id: string | null;
  name: string;
  number: string | null;
  rarity: string | null;
  supertype: string | null;
  types: string[] | null;
  image_small: string | null;
  image_large: string | null;
  image_ptbr: string | null;
  created_at: string;
  collection_number: string;
  set_name: string | null;
  printed_total: number | null;
}

export interface CardWithMarket extends Card {
  offers_count: number;
  min_price_cents: number | null;
  avg_price_cents: number | null;
}

function mapCardRow(row: any): Card {
  const setData = Array.isArray(row.sets) ? row.sets[0] : row.sets;
  const printedTotal = setData?.printed_total ?? setData?.total ?? null;
  return {
    ...row,
    collection_number: formatCollectorNumber(row.number, printedTotal),
    set_name: setData?.name || null,
    printed_total: printedTotal,
    sets: undefined,
  } as Card;
}

export function useCards(search: string, limit = 100) {
  return useQuery({
    queryKey: ["cards", search, limit],
    queryFn: async () => {
      const client = supabase as any;
      const parsed = parseCardSearch(search);

      const needsInnerJoin = parsed.kind === "exact_number";
      let query = client
        .from("cards")
        .select(`*, sets${needsInnerJoin ? "!inner" : ""}(name, total, printed_total)`)
        .order("name")
        .limit(limit);

      switch (parsed.kind) {
        case "exact_number":
          // "071/182" → match card number AND set printed_total
          query = query.eq("number", parsed.number).eq("sets.printed_total", parsed.total);
          break;
        case "prefix_number":
          // "071/" → all cards with that number
          query = query.eq("number", parsed.number);
          break;
        case "plain_number":
          // "71" → match as number
          query = query.eq("number", parsed.number);
          break;
        case "text":
          if (parsed.query) {
            query = query.or(
              `name.ilike.%${parsed.query}%,sets.name.ilike.%${parsed.query}%`
            );
          }
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapCardRow) as Card[];
    },
  });
}

export function useSets() {
  return useQuery({
    queryKey: ["sets"],
    queryFn: async () => {
      const client = supabase as any;
      // Fetch all sets in batches to avoid row limits
      const allSets: any[] = [];
      let offset = 0;
      const batchSize = 100;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await client
          .from("sets")
          .select("*")
          .order("release_date", { ascending: false })
          .range(offset, offset + batchSize - 1);
        if (error) throw error;
        if (data && data.length > 0) {
          allSets.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      return allSets;
    },
  });
}

export function useTrendingCards() {
  return useQuery({
    queryKey: ["trending-cards"],
    queryFn: async () => {
      const client = supabase as any;
      // Get cards that have active listings via the view
      const { data: stats, error: statsErr } = await client
        .from("card_market_stats")
        .select("*")
        .order("offers_count", { ascending: false })
        .limit(12);

      if (statsErr) throw statsErr;
      if (!stats || stats.length === 0) return [];

      const cardIds = stats.map((s: any) => s.card_id);
      const { data: cards, error: cardsErr } = await client
        .from("cards")
        .select("*, sets(name, total, printed_total)")
        .in("id", cardIds);

      if (cardsErr) throw cardsErr;

      return (cards || []).map((row: any) => {
        const card = mapCardRow(row);
        const stat = stats.find((s: any) => s.card_id === card.id);
        return {
          ...card,
          offers_count: stat?.offers_count || 0,
          min_price_cents: stat?.min_price_cents || null,
          avg_price_cents: stat?.avg_price_cents || null,
        } as CardWithMarket;
      });
    },
  });
}

export function useCardDetail(cardId: string | undefined) {
  return useQuery({
    queryKey: ["card-detail", cardId],
    enabled: !!cardId,
    queryFn: async () => {
      const client = supabase as any;
      const { data, error } = await client
        .from("cards")
        .select("*, sets(name, total, printed_total, logo, symbol)")
        .eq("id", cardId)
        .single();
      if (error) throw error;
      return mapCardRow(data) as Card & { sets?: any };
    },
  });
}

export function useCardListings(cardId: string | undefined) {
  return useQuery({
    queryKey: ["card-listings", cardId],
    enabled: !!cardId,
    queryFn: async () => {
      const client = supabase as any;
      const { data, error } = await client
        .from("listings")
        .select("*, profiles(display_name, reputation_score, city, state)")
        .eq("card_id", cardId)
        .eq("status", "active")
        .order("price_cents", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCardMarketStats(cardId: string | undefined) {
  return useQuery({
    queryKey: ["card-market-stats", cardId],
    enabled: !!cardId,
    queryFn: async () => {
      const client = supabase as any;
      const { data, error } = await client
        .from("card_market_stats")
        .select("*")
        .eq("card_id", cardId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
