import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Create sync record
    const { data: syncRecord, error: syncErr } = await supabase
      .from("sync_status")
      .insert({ status: "running", started_at: new Date().toISOString() })
      .select()
      .single();

    if (syncErr) throw syncErr;

    const syncId = syncRecord.id;

    // Fetch sets from Pokémon TCG API
    const setsRes = await fetch("https://api.pokemontcg.io/v2/sets?pageSize=20", {
      headers: { 
        "Accept": "application/json",
        "User-Agent": "PokemonTCGApp/1.0",
      },
    });
    if (!setsRes.ok) {
      const errBody = await setsRes.text();
      console.error("Sets API response:", setsRes.status, errBody);
      throw new Error(`Sets API error: ${setsRes.status} - ${errBody.substring(0, 200)}`);
    }
    const setsData = await setsRes.json();
    const sets = setsData.data;

    await supabase
      .from("sync_status")
      .update({ total_sets: sets.length })
      .eq("id", syncId);

    let totalCards = 0;
    let syncedCards = 0;
    let syncedSets = 0;

    for (const s of sets) {
      // Upsert set
      await supabase.from("sets").upsert({
        id: s.id,
        name: s.name,
        series: s.series,
        total: s.total,
        release_date: s.releaseDate,
        logo: s.images?.logo,
        symbol: s.images?.symbol,
      });

      // Fetch cards for this set (first page only to keep it fast)
      const cardsRes = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${s.id}&pageSize=50&page=1`
      );
      if (!cardsRes.ok) {
        console.error(`Cards API error for set ${s.id}: ${cardsRes.status}`);
        continue;
      }
      const cardsData = await cardsRes.json();
      const cards = cardsData.data || [];
      totalCards += cards.length;

      // Batch upsert cards
      if (cards.length > 0) {
        const rows = cards.map((c: any) => ({
          id: c.id,
          set_id: s.id,
          name: c.name,
          number: c.number,
          rarity: c.rarity || "Unknown",
          supertype: c.supertype,
          types: c.types || [],
          image_small: c.images?.small,
          image_large: c.images?.large,
        }));

        await supabase.from("cards").upsert(rows);
        syncedCards += cards.length;
      }

      syncedSets++;
      await supabase
        .from("sync_status")
        .update({ synced_sets: syncedSets, total_cards: totalCards, synced_cards: syncedCards })
        .eq("id", syncId);
    }

    await supabase
      .from("sync_status")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        synced_sets: syncedSets,
        total_cards: totalCards,
        synced_cards: syncedCards,
      })
      .eq("id", syncId);

    return new Response(
      JSON.stringify({ success: true, sets: syncedSets, cards: syncedCards }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

