import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tag, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SectionHeader from "./SectionHeader";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function useRecentListings(limit = 12) {
  return useQuery({
    queryKey: ["recent-listings", limit],
    queryFn: async () => {
      const client = supabase as any;
      const { data, error } = await client
        .from("listings")
        .select("*, cards(id, name, number, image_small, image_ptbr, sets(name, printed_total, total)), profiles(display_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

const RecentListingsRow = () => {
  const { data: listings = [], isLoading } = useRecentListings(12);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section id="recentes">
        <SectionHeader title="Últimas Anunciadas" icon="🕐" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </section>
    );
  }

  if (listings.length === 0) return null;

  return (
    <section id="recentes">
      <SectionHeader
        title="Últimas Anunciadas"
        icon="🕐"
        subtitle="Anúncios mais recentes"
        ctaLabel="Ver anúncios recentes"
        ctaHref="/marketplace?sort=recent"
      />
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {listings.map((listing: any) => {
          const card = Array.isArray(listing.cards) ? listing.cards[0] : listing.cards;
          const setData = card?.sets ? (Array.isArray(card.sets) ? card.sets[0] : card.sets) : null;
          const printedTotal = setData?.printed_total ?? setData?.total;
          const displayNum = card?.number && printedTotal
            ? `${card.number.toString().padStart(2, "0")}/${printedTotal}`
            : card?.number || "";

          return (
            <button
              key={listing.id}
              onClick={() => navigate(`/pokemon/cards/${card?.id}`)}
              className="group overflow-hidden rounded-xl border border-border bg-gradient-card text-left shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
            >
              <div className="aspect-[3/4] overflow-hidden bg-secondary">
                <img
                  src={card?.image_ptbr || card?.image_small || "https://via.placeholder.com/400x560"}
                  alt={card?.name || ""}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                  {card?.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {setData?.name} · {displayNum}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="flex items-center gap-1 font-display text-sm font-bold text-primary">
                    <Tag className="h-3 w-3" />
                    {formatPrice(listing.price_cents)}
                  </p>
                  <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo(listing.created_at)}
                  </span>
                </div>
                <div className="mt-1.5 flex gap-1">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {listing.condition}
                  </Badge>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default RecentListingsRow;
