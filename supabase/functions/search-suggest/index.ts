import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return new Response(JSON.stringify({ cards: [], sets: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Detect number/total pattern like "05/20" or "44/105"
    const numberPattern = /^(\d{1,3})\s*\/\s*(\d{1,3})$/;
    const numberOnlyPattern = /^(\d{1,3})$/;
    const match = q.match(numberPattern);
    const numberOnlyMatch = !match ? q.match(numberOnlyPattern) : null;

    let cards: any[] = [];
    let sets: any[] = [];

    if (match) {
      // Search by number/total
      const [, num, total] = match;
      const { data } = await supabase
        .from("cards")
        .select("id, name, number, image_small, set_id, sets!inner(name, total, release_date)")
        .eq("number", num)
        .eq("sets.total", parseInt(total))
        .order("sets(release_date)", { ascending: false })
        .limit(8);

      if (data) {
        // Get market stats for these cards
        const cardIds = data.map((c: any) => c.id);
        const { data: stats } = await supabase
          .from("card_market_stats")
          .select("card_id, min_price_cents, offers_count")
          .in("card_id", cardIds);

        const statsMap = new Map((stats || []).map((s: any) => [s.card_id, s]));

        cards = data.map((c: any) => {
          const s = statsMap.get(c.id);
          const setData = Array.isArray(c.sets) ? c.sets[0] : c.sets;
          return {
            id: c.id,
            name: c.name,
            number: c.number,
            setName: setData?.name || "",
            setTotal: setData?.total || 0,
            releaseYear: setData?.release_date ? parseInt(setData.release_date.substring(0, 4)) : null,
            image: c.image_small,
            minPriceCents: s?.min_price_cents || null,
            offersCount: s?.offers_count || 0,
          };
        });
      }
    } else if (numberOnlyMatch) {
      // Search by number only
      const num = numberOnlyMatch[1];
      const { data } = await supabase
        .from("cards")
        .select("id, name, number, image_small, set_id, sets(name, total, release_date)")
        .eq("number", num)
        .order("created_at", { ascending: false })
        .limit(8);

      if (data) {
        const cardIds = data.map((c: any) => c.id);
        const { data: stats } = cardIds.length > 0
          ? await supabase.from("card_market_stats").select("card_id, min_price_cents, offers_count").in("card_id", cardIds)
          : { data: [] };

        const statsMap = new Map((stats || []).map((s: any) => [s.card_id, s]));

        cards = data.map((c: any) => {
          const s = statsMap.get(c.id);
          const setData = Array.isArray(c.sets) ? c.sets[0] : c.sets;
          return {
            id: c.id,
            name: c.name,
            number: c.number,
            setName: setData?.name || "",
            setTotal: setData?.total || 0,
            releaseYear: setData?.release_date ? parseInt(setData.release_date.substring(0, 4)) : null,
            image: c.image_small,
            minPriceCents: s?.min_price_cents || null,
            offersCount: s?.offers_count || 0,
          };
        });
      }
    } else {
      // Text search - search cards and sets in parallel
      const searchTerm = `%${q}%`;
      const ilikeTerm = `${q}%`; // prefix match

      const [cardsResult, setsResult] = await Promise.all([
        supabase
          .from("cards")
          .select("id, name, number, image_small, set_id, sets(name, total, release_date)")
          .ilike("name", searchTerm)
          .limit(8),
        supabase
          .from("sets")
          .select("id, name, total, release_date, logo")
          .ilike("name", searchTerm)
          .order("release_date", { ascending: false })
          .limit(3),
      ]);

      // Get market stats for card results
      const cardData = cardsResult.data || [];
      const cardIds = cardData.map((c: any) => c.id);
      const { data: stats } = cardIds.length > 0
        ? await supabase.from("card_market_stats").select("card_id, min_price_cents, offers_count").in("card_id", cardIds)
        : { data: [] };

      const statsMap = new Map((stats || []).map((s: any) => [s.card_id, s]));

      // Sort: prefix matches first, then by offers count
      const lowerQ = q.toLowerCase();
      cards = cardData
        .map((c: any) => {
          const s = statsMap.get(c.id);
          const setData = Array.isArray(c.sets) ? c.sets[0] : c.sets;
          const nameL = c.name.toLowerCase();
          const score = nameL.startsWith(lowerQ) ? 0 : nameL.includes(lowerQ) ? 1 : 2;
          return {
            id: c.id,
            name: c.name,
            number: c.number,
            setName: setData?.name || "",
            setTotal: setData?.total || 0,
            releaseYear: setData?.release_date ? parseInt(setData.release_date.substring(0, 4)) : null,
            image: c.image_small,
            minPriceCents: s?.min_price_cents || null,
            offersCount: s?.offers_count || 0,
            _score: score,
          };
        })
        .sort((a: any, b: any) => a._score - b._score || (b.offersCount - a.offersCount))
        .map(({ _score, ...rest }: any) => rest);

      sets = (setsResult.data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        total: s.total,
        year: s.release_date ? parseInt(s.release_date.substring(0, 4)) : null,
        logo: s.logo?.replace("http://", "https://") || null,
      }));
    }

    return new Response(JSON.stringify({ cards, sets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=30" },
    });
  } catch (error) {
    console.error("Search suggest error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
