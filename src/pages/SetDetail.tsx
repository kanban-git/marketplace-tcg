import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CardGrid from "@/components/CardGrid";
import { ArrowLeft, Layers } from "lucide-react";
import { type Card } from "@/hooks/useCards";
import { useState, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

function ensureHttps(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//i, "https://");
}

const SetLogo = ({ set }: { set: any }) => {
  const [stage, setStage] = useState<"logo" | "symbol" | "icon">("logo");

  const logoUrl = ensureHttps(set.logo);
  const symbolUrl = ensureHttps(set.symbol);

  if (stage === "icon" || (!logoUrl && !symbolUrl)) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
        <Layers className="h-7 w-7 text-primary" />
      </div>
    );
  }

  if (stage === "symbol") {
    if (!symbolUrl) {
      return (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
          <Layers className="h-7 w-7 text-primary" />
        </div>
      );
    }
    return (
      <img src={symbolUrl} alt={set.name} className="h-14 w-auto" onError={() => setStage("icon")} />
    );
  }

  return (
    <img
      src={logoUrl!}
      alt={set.name}
      className="h-14 w-auto"
      onError={() => setStage(symbolUrl ? "symbol" : "icon")}
    />
  );
};

const SetDetail = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (setId) trackEvent("view_collection", { entity_type: "collection", entity_id: setId });
  }, [setId]);

  const { data: set } = useQuery({
    queryKey: ["set", setId],
    enabled: !!setId,
    queryFn: async () => {
      const client = supabase as any;
      const { data, error } = await client
        .from("sets")
        .select("*")
        .eq("id", setId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["set-cards", setId],
    enabled: !!setId,
    queryFn: async () => {
      const client = supabase as any;
      const { data, error } = await client
        .from("cards")
        .select("*, sets(name, total, printed_total)")
        .eq("set_id", setId)
        .order("number")
        .limit(500);
      if (error) throw error;
      return (data || []).map((row: any) => {
        const setData = Array.isArray(row.sets) ? row.sets[0] : row.sets;
        const printedTotal = setData?.printed_total ?? setData?.total;
        const num = row.number;
        const formatted =
          num && printedTotal
            ? `${num.toString().padStart(2, "0")}/${printedTotal}`
            : num || "—";
        return {
          ...row,
          collection_number: formatted,
          set_name: setData?.name || null,
          sets: undefined,
        } as Card;
      });
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="mb-8 flex items-center gap-4">
          {set && <SetLogo set={set} />}
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {set?.name || "Coleção"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {cards.length} cartas{set?.release_date ? ` · ${set.release_date}` : ""}
            </p>
          </div>
        </div>

        <CardGrid cards={cards} isLoading={isLoading} compact />
      </main>
      <Footer />
    </div>
  );
};

export default SetDetail;
