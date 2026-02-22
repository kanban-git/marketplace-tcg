import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CardGrid from "@/components/CardGrid";
import { ArrowLeft } from "lucide-react";
import { type Card } from "@/hooks/useCards";

const SetDetail = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();

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
        .select("*, sets(name, total)")
        .eq("set_id", setId)
        .order("number")
        .limit(500);
      if (error) throw error;
      return (data || []).map((row: any) => {
        const setTotal = row.sets?.total;
        const num = row.number;
        const formatted =
          num && setTotal
            ? `${num.toString().padStart(2, "0")}/${setTotal}`
            : num || "—";
        return {
          ...row,
          collection_number: formatted,
          set_name: row.sets?.name || null,
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
          {set?.logo && (
            <img src={set.logo} alt={set?.name} className="h-14 w-auto" />
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {set?.name || "Coleção"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {cards.length} cartas{set?.release_date ? ` · ${set.release_date}` : ""}
            </p>
          </div>
        </div>

        <CardGrid cards={cards} isLoading={isLoading} />
      </main>
      <Footer />
    </div>
  );
};

export default SetDetail;
