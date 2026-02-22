import { useNavigate } from "react-router-dom";
import type { Card } from "@/hooks/useCards";

interface Props {
  cards: Card[];
  isLoading?: boolean;
}

const CardGrid = ({ cards, isLoading }: Props) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-xl bg-secondary"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {cards.map((card, i) => (
        <button
          key={card.id}
          onClick={() => navigate(`/pokemon/cards/${card.id}`)}
          className="group animate-fade-in overflow-hidden rounded-xl border border-border bg-gradient-card text-left shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
          style={{ animationDelay: `${i * 40}ms` }}
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
          </div>
        </button>
      ))}
    </div>
  );
};

export default CardGrid;
