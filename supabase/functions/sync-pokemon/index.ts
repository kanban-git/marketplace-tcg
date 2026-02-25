import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "Accept": "application/json", "User-Agent": "PokemonTCGApp/1.0" },
      });
      if ([502, 503, 504].includes(res.status) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${res.status}`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed after ${maxRetries} retries: ${url}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const batchSize = body.batchSize || 10;
    const offset = body.offset || 0;

    // Step 1: Fetch ALL set IDs from TCGDex (lightweight list)
    const setsRes = await fetchWithRetry("https://api.tcgdex.net/v2/en/sets");
    if (!setsRes.ok) {
      const err = await setsRes.text();
      throw new Error(`Sets API error: ${setsRes.status} - ${err.substring(0, 200)}`);
    }
    const allSets: any[] = await setsRes.json();
    const totalSets = allSets.length;

    // Sort by release date (newest first for better UX)
    allSets.sort((a: any, b: any) => (b.releaseDate || "").localeCompare(a.releaseDate || ""));

    // Slice the batch
    const batch = allSets.slice(offset, offset + batchSize);
    if (batch.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All sets already synced", totalSets, offset }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing batch: offset=${offset}, batchSize=${batchSize}, total=${totalSets}, batch=${batch.length}`);

    let syncedCards = 0;
    let syncedSets = 0;

    for (const s of batch) {
      // Fetch full set details (includes cards)
      const setRes = await fetchWithRetry(`https://api.tcgdex.net/v2/en/sets/${s.id}`);
      if (!setRes.ok) {
        console.error(`Set ${s.id} fetch failed: ${setRes.status}`);
        await setRes.text();
        continue;
      }
      const setData = await setRes.json();

      // Upsert set
      await supabase.from("sets").upsert({
        id: s.id,
        name: setData.name || s.name,
        series: setData.serie?.name || null,
        total: setData.cardCount?.total || null,
        printed_total: setData.cardCount?.official || setData.cardCount?.total || null,
        release_date: setData.releaseDate || null,
        logo: setData.logo ? `${setData.logo}/high.webp` : null,
        symbol: setData.symbol ? `${setData.symbol}/high.webp` : null,
      });

      // Upsert cards
      const cards = setData.cards || [];
      if (cards.length > 0) {
        const rows = cards.map((c: any) => ({
          id: `${s.id}-${c.localId}`,
          set_id: s.id,
          name: c.name,
          number: c.localId,
          rarity: c.rarity || "Unknown",
          supertype: c.category || null,
          types: c.types || [],
          image_small: c.image ? `${c.image}/low.webp` : null,
          image_large: c.image ? `${c.image}/high.webp` : null,
        }));

        // Upsert in chunks of 100 to avoid payload limits
        for (let i = 0; i < rows.length; i += 100) {
          const chunk = rows.slice(i, i + 100);
          const { error } = await supabase.from("cards").upsert(chunk);
          if (error) console.error(`Upsert error for set ${s.id}:`, error.message);
        }
        syncedCards += cards.length;
      }

      syncedSets++;
      console.log(`Set ${syncedSets}/${batch.length}: ${setData.name} (${cards.length} cards)`);

      // Small delay to be gentle on the API
      await new Promise(r => setTimeout(r, 200));
    }

    const nextOffset = offset + batchSize;
    const hasMore = nextOffset < totalSets;

    return new Response(
      JSON.stringify({
        success: true,
        syncedSets,
        syncedCards,
        totalSets,
        offset,
        nextOffset: hasMore ? nextOffset : null,
        hasMore,
        message: hasMore
          ? `Synced ${syncedSets} sets (${syncedCards} cards). Call again with offset=${nextOffset} for next batch.`
          : `All done! Synced ${syncedSets} sets (${syncedCards} cards).`,
      }),
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
