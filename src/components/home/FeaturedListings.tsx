import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tag, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SectionHeader from "./SectionHeader";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const conditionLabel: Record<string, string> = {
  NM: "Near Mint", LP: "Lightly Played", MP: "Moderately Played",
  HP: "Heavily Played", Damaged: "Damaged",
};

export function useFeaturedListings(limit = 12) {
  return useQuery({
    queryKey: ["featured-listings", limit],
    queryFn: async () => {
      const client = supabase as any;
      const { data, error } = await client
        .from("listings")
        .select("*, cards(id, name, number, image_small, image_ptbr, sets(name, printed_total, total)), profiles(display_name, reputation_score)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

const FeaturedListings = () => {
  const { data: listings = [], isLoading } = useFeaturedListings(12);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section id="ofertas">
        <SectionHeader title="Ofertas em Destaque" icon="🏷️" subtitle="Anúncios ativos no marketplace" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section id="ofertas">
        <SectionHeader title="Ofertas em Destaque" icon="🏷️" subtitle="Anúncios ativos no marketplace" />
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 py-16 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nenhuma oferta ativa ainda.</p>
          <p className="mt-1 text-sm text-muted-foreground">Seja o primeiro a anunciar!</p>
        </div>
      </section>
    );
  }

  return (
    <section id="ofertas">
      <SectionHeader
        title="Ofertas em Destaque"
        icon="🏷️"
        subtitle="Anúncios ativos no marketplace"
        ctaLabel="Ver tudo no Marketplace"
        ctaHref="/marketplace"
      />
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {listings.map((listing: any) => {
          const card = Array.isArray(listing.cards) ? listing.cards[0] : listing.cards;
          const setData = card?.sets ? (Array.isArray(card.sets) ? card.sets[0] : card.sets) : null;
          const printedTotal = setData?.printed_total ?? setData?.total;
          const displayNum = card?.number && printedTotal
            ? `${card.number.toString().padStart(2, "0")}/${printedTotal}`
            : card?.number || "";
          const seller = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles;

          return (
            <button
              key={listing.id}
              onClick={() => navigate(`/pokemon/cards/${card?.id}`)}
              className="group overflow-hidden rounded-xl border border-border bg-gradient-card text-left shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
            >
              <div className="aspect-[3/4] overflow-hidden bg-secondary">
                <img
                  src={card?.image_ptbr || card?.image_small || "https://via.placeholder.com/400x560"}
                  alt={card?.name || "Card"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                  {card?.name || "Carta"}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {setData?.name} · {displayNum}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {listing.condition}
                  </Badge>
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {listing.language === "pt" ? "PT" : listing.language === "en" ? "EN" : listing.language?.toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-2 flex items-center gap-1 font-display text-sm font-bold text-primary">
                  <Tag className="h-3 w-3" />
                  {formatPrice(listing.price_cents)}
                </p>
                {seller && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    por {seller.display_name}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedListings;
