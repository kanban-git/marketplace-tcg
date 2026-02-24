import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 50;
const TCGDEX_BASE = "https://api.tcgdex.net/v2/pt-br/cards";
const DELAY_MS = 300; // be nice to the API

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Optional: pass ?limit=500 to control batch size or ?force=true to re-check all
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "1000", 10);
  const force = url.searchParams.get("force") === "true";

  let updated = 0;
  let checked = 0;
  let errors = 0;
  let offset = 0;

  try {
    while (checked < limit) {
      // Fetch cards that don't have image_ptbr yet (unless force)
      let query = supabase
        .from("cards")
        .select("id, set_id, number, name")
        .order("id")
        .range(offset, offset + BATCH_SIZE - 1);

      if (!force) {
        query = query.is("image_ptbr", null);
      }

      const { data: cards, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      if (!cards || cards.length === 0) break;

      for (const card of cards) {
        checked++;
        if (checked > limit) break;

        try {
          // TCGdex uses the same {setId}-{localId} format as pokemontcg.io
          const cardId = card.id;
          const res = await fetch(`${TCGDEX_BASE}/${cardId}`);

          if (res.ok) {
            const data = await res.json();
            if (data.image) {
              // TCGdex returns base URL, append /high for high-res
              const imagePtbr = `${data.image}/high.webp`;
              const { error: updErr } = await supabase
                .from("cards")
                .update({ image_ptbr: imagePtbr })
                .eq("id", card.id);

              if (updErr) {
                console.error(`Error updating ${card.id}:`, updErr);
                errors++;
              } else {
                updated++;
              }
            }
          }
          // If 404, card doesn't exist in PT-BR — skip silently
        } catch (e) {
          console.error(`Error processing card ${card.id}:`, e);
          errors++;
        }

        await sleep(DELAY_MS);
      }

      offset += BATCH_SIZE;
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked,
        updated,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sync-ptbr-images error:", e);
    return new Response(
      JSON.stringify({ error: String(e), checked, updated, errors }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
