import { useTrendingCards } from "@/hooks/useCards";
import { useNavigate } from "react-router-dom";
import { Tag, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import SectionHeader from "./SectionHeader";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TrendingCardsRow = () => {
  const { data: cards = [], isLoading } = useTrendingCards();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <section id="trending">
        <SectionHeader title="Cartas em Alta" icon="🔥" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] w-40 shrink-0 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </section>
    );
  }

  if (cards.length === 0) {
    return (
      <section id="trending">
        <SectionHeader title="Cartas em Alta" icon="🔥" subtitle="Ranking de cartas mais procuradas" />
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 py-16 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nenhuma carta em alta ainda.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="trending">
      <SectionHeader
        title="Cartas em Alta"
        icon="🔥"
        subtitle="Top cartas com mais ofertas ativas"
        ctaLabel="Ver ranking"
        ctaHref="/trending"
      />
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/80 p-1.5 text-foreground shadow-md backdrop-blur-sm hover:bg-secondary hidden md:block"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        >
          {cards.slice(0, 10).map((card, idx) => (
            <button
              key={card.id}
              onClick={() => navigate(`/pokemon/cards/${card.id}`)}
              className="group relative w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-gradient-card text-left shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow md:w-44"
            >
              {/* Rank badge */}
              <span className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground">
                {idx + 1}
              </span>
              <div className="aspect-[3/4] overflow-hidden bg-secondary">
                <img
                  src={(card as any).image_ptbr || card.image_small || "https://via.placeholder.com/400x560"}
                  alt={card.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-2.5">
                <h3 className="line-clamp-1 text-xs font-semibold text-foreground">
                  {card.name}
                </h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {card.set_name} · {card.collection_number}
                </p>
                {card.min_price_cents && card.min_price_cents > 0 && (
                  <p className="mt-1.5 flex items-center gap-1 font-display text-xs font-bold text-primary">
                    <Tag className="h-3 w-3" />
                    {formatPrice(card.min_price_cents)}
                  </p>
                )}
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {card.offers_count} oferta{card.offers_count !== 1 ? "s" : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/80 p-1.5 text-foreground shadow-md backdrop-blur-sm hover:bg-secondary hidden md:block"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default TrendingCardsRow;
