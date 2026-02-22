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
        console.log(`Retry ${attempt + 1}/${maxRetries} for ${url} after ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retry ${attempt + 1}/${maxRetries} after network error: ${err.message}`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed after ${maxRetries} retries: ${url}`);
}

// Try pokemontcg.io first, fall back to TCGDex
async function fetchSets(): Promise<any[]> {
  console.log("Trying pokemontcg.io...");
  const res = await fetchWithRetry("https://api.pokemontcg.io/v2/sets?pageSize=20");
  if (res.ok) {
    const data = await res.json();
    console.log(`pokemontcg.io returned ${data.data?.length} sets`);
    return (data.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      series: s.series,
      total: s.total,
      release_date: s.releaseDate,
      logo: s.images?.logo,
      symbol: s.images?.symbol,
    }));
  }

  console.log(`pokemontcg.io failed (${res.status}), trying TCGDex fallback...`);
  await res.text(); // consume body
  const tcgRes = await fetchWithRetry("https://api.tcgdex.net/v2/en/sets");
  if (!tcgRes.ok) {
    const body = await tcgRes.text();
    throw new Error(`Both APIs failed. TCGDex: ${tcgRes.status} - ${body.substring(0, 200)}`);
  }
  const tcgSets = await tcgRes.json();
  console.log(`TCGDex returned ${tcgSets.length} sets`);
  // TCGDex returns a flat array, take first 20
  return tcgSets.slice(0, 20).map((s: any) => ({
    id: s.id,
    name: s.name,
    series: s.serie?.name || null,
    total: s.cardCount?.total || null,
    release_date: s.releaseDate || null,
    logo: s.logo ? `${s.logo}/high.webp` : null,
    symbol: s.symbol ? `${s.symbol}/high.webp` : null,
    _source: "tcgdex",
  }));
}

async function fetchCardsForSet(setId: string, source?: string): Promise<any[]> {
  if (source === "tcgdex") {
    const res = await fetchWithRetry(`https://api.tcgdex.net/v2/en/sets/${setId}`);
    if (!res.ok) { await res.text(); return []; }
    const data = await res.json();
    return (data.cards || []).slice(0, 50).map((c: any) => ({
      id: `${setId}-${c.localId}`,
      set_id: setId,
      name: c.name,
      number: c.localId,
      rarity: c.rarity || "Unknown",
      supertype: c.category || null,
      types: c.types || [],
      image_small: c.image ? `${c.image}/low.webp` : null,
      image_large: c.image ? `${c.image}/high.webp` : null,
    }));
  }

  // pokemontcg.io
  const res = await fetchWithRetry(
    `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=50&page=1`
  );
  if (!res.ok) {
    console.error(`Cards API error for set ${setId}: ${res.status}`);
    await res.text();
    return [];
  }
  const data = await res.json();
  return (data.data || []).map((c: any) => ({
    id: c.id,
    set_id: setId,
    name: c.name,
    number: c.number,
    rarity: c.rarity || "Unknown",
    supertype: c.supertype,
    types: c.types || [],
    image_small: c.images?.small,
    image_large: c.images?.large,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: syncRecord, error: syncErr } = await supabase
      .from("sync_status")
      .insert({ status: "running", started_at: new Date().toISOString() })
      .select()
      .single();

    if (syncErr) throw syncErr;
    const syncId = syncRecord.id;

    const sets = await fetchSets();
    const source = sets[0]?._source;

    await supabase
      .from("sync_status")
      .update({ total_sets: sets.length })
      .eq("id", syncId);

    let totalCards = 0;
    let syncedCards = 0;
    let syncedSets = 0;

    for (const s of sets) {
      await supabase.from("sets").upsert({
        id: s.id,
        name: s.name,
        series: s.series,
        total: s.total,
        release_date: s.release_date,
        logo: s.logo,
        symbol: s.symbol,
      });

      const cards = await fetchCardsForSet(s.id, source);
      totalCards += cards.length;

      if (cards.length > 0) {
        await supabase.from("cards").upsert(cards);
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
      JSON.stringify({ success: true, sets: syncedSets, cards: syncedCards, source: source || "pokemontcg" }),
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
