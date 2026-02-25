import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const offset = body.offset || 0;
    const limit = body.limit || 80;

    // Fetch sets from DB that still need printed_total correction
    const { data: sets, error } = await supabase
      .from("sets")
      .select("id, total, printed_total")
      .order("id")
      .range(offset, offset + limit - 1);

    if (error) throw error;

    let updated = 0;
    let failed = 0;

    for (const set of sets || []) {
      try {
        const res = await fetch(`https://api.tcgdex.net/v2/en/sets/${set.id}`);
        if (!res.ok) {
          console.log(`Set ${set.id}: API returned ${res.status}`);
          failed++;
          continue;
        }
        const data = await res.json();
        const official = data.cardCount?.official;
        const total = data.cardCount?.total;

        if (official || total) {
          const { error: upErr } = await supabase
            .from("sets")
            .update({
              printed_total: official || total,
              total: total || set.total,
            })
            .eq("id", set.id);

          if (upErr) {
            console.error(`Set ${set.id} update error:`, upErr.message);
            failed++;
          } else {
            updated++;
            console.log(`Set ${set.id}: printed_total=${official}, total=${total}`);
          }
        }

        await new Promise((r) => setTimeout(r, 150));
      } catch (e) {
        console.error(`Set ${set.id} error:`, e.message);
        failed++;
      }
    }

    const nextOffset = offset + limit;
    return new Response(
      JSON.stringify({
        success: true,
        processed: (sets || []).length,
        updated,
        failed,
        nextOffset,
        hasMore: (sets || []).length === limit,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Backfill error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
