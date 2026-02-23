import { useNavigate } from "react-router-dom";
import type { Card } from "@/hooks/useCards";

interface Props {
  cards: Card[];
  isLoading?: boolean;
}

interface Props {
  cards: Card[];
  isLoading?: boolean;
  compact?: boolean;
}

const CardGrid = ({ cards, isLoading, compact }: Props) => {
  const navigate = useNavigate();

  const gridClass = compact
    ? "grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"
    : "grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-lg bg-secondary"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {cards.map((card, i) => (
        <button
          key={card.id}
          onClick={() => navigate(`/pokemon/cards/${card.id}`)}
          className={`group animate-fade-in overflow-hidden rounded-lg border border-border bg-gradient-card text-left transition-all hover:scale-105 hover:shadow-md hover:border-primary/30 ${compact ? "shadow-sm" : "shadow-card hover:-translate-y-1 hover:shadow-glow"}`}
          style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}
        >
          <div className="aspect-[3/4] overflow-hidden bg-secondary">
            <img
              src={card.image_small || "https://via.placeholder.com/400x560"}
              alt={card.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className={compact ? "px-2 py-1.5" : "p-3"}>
            <h3 className={`line-clamp-1 font-semibold text-foreground ${compact ? "text-xs" : "text-sm"}`}>
              {card.name}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {compact ? card.collection_number : `${card.set_name} · ${card.collection_number}`}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default CardGrid;
