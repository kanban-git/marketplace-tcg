import { useSets } from "@/hooks/useCards";
import { useNavigate } from "react-router-dom";
import { Calendar, Layers } from "lucide-react";

const SetsGrid = () => {
  const { data: sets = [], isLoading } = useSets();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl bg-secondary"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {sets.map((set: any) => (
        <button
          key={set.id}
          onClick={() => navigate(`/sets/${set.id}`)}
          className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-gradient-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
        >
          {set.logo ? (
            <img
              src={set.logo}
              alt={set.name}
              className="h-12 w-auto object-contain transition-transform group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-6 w-6 text-primary" />
            </div>
          )}
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
            {set.name}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {set.total && (
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {set.total} cartas
              </span>
            )}
            {set.release_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {set.release_date.slice(0, 4)}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default SetsGrid;
