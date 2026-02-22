import { useTrendingCards, type CardWithMarket } from "@/hooks/useCards";
import { useNavigate } from "react-router-dom";
import { Tag, ShoppingBag } from "lucide-react";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const TrendingCards = () => {
  const { data: cards = [], isLoading } = useTrendingCards();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-xl bg-secondary"
          />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/30 py-16 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-muted-foreground">
          Nenhuma carta com ofertas ativas ainda.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Seja o primeiro a anunciar!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => navigate(`/pokemon/cards/${card.id}`)}
          className="group overflow-hidden rounded-xl border border-border bg-gradient-card text-left shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
        >
          <div className="aspect-[3/4] overflow-hidden bg-secondary">
            <img
              src={card.image_small || "https://via.placeholder.com/400x560"}
              alt={card.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="p-3">
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
              {card.name}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {card.set_name} · {card.collection_number}
            </p>
            {card.min_price_cents && card.min_price_cents > 0 && (
              <p className="mt-2 flex items-center gap-1 font-display text-sm font-bold text-primary">
                <Tag className="h-3 w-3" />A partir de{" "}
                {formatPrice(card.min_price_cents)}
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {card.offers_count} oferta{card.offers_count !== 1 ? "s" : ""}{" "}
              disponíve{card.offers_count !== 1 ? "is" : "l"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default TrendingCards;
