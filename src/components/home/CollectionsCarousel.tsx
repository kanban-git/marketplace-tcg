import { useSets } from "@/hooks/useCards";
import { useNavigate } from "react-router-dom";
import { Calendar, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import SectionHeader from "./SectionHeader";

function ensureHttps(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//i, "https://");
}

const SetImage = ({ set }: { set: any }) => {
  const [useFallback, setUseFallback] = useState<"logo" | "symbol" | "none">("logo");
  const logo = ensureHttps(set.logo);
  const symbol = ensureHttps(set.symbol);

  if (useFallback === "none" || (!logo && !symbol)) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Layers className="h-5 w-5 text-primary" />
      </div>
    );
  }

  const src = useFallback === "logo" ? logo : symbol;
  if (!src) return <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Layers className="h-5 w-5 text-primary" /></div>;

  return (
    <img
      src={src}
      alt={set.name}
      className="h-10 w-auto object-contain"
      loading="lazy"
      onError={() => setUseFallback(useFallback === "logo" && symbol ? "symbol" : "none")}
    />
  );
};

const CollectionsCarousel = () => {
  const { data: sets = [], isLoading } = useSets();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const recent = sets.slice(0, 12);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <section id="colecoes">
        <SectionHeader title="Coleções" icon="📦" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 w-48 shrink-0 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="colecoes">
      <SectionHeader
        title="Coleções"
        icon="📦"
        subtitle="Navegue pelas expansões Pokémon TCG"
        ctaLabel="Ver todas"
        ctaHref="/colecoes"
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
          {recent.map((set: any) => (
            <button
              key={set.id}
              onClick={() => navigate(`/sets/${set.id}`)}
              className="group flex w-44 shrink-0 snap-start flex-col items-center gap-2.5 rounded-xl border border-border bg-gradient-card p-4 text-center transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow md:w-48"
            >
              <SetImage set={set} />
              <h3 className="line-clamp-2 text-xs font-semibold text-foreground md:text-sm">
                {set.name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {set.printed_total && (
                  <span className="flex items-center gap-0.5">
                    <Layers className="h-3 w-3" />
                    {set.printed_total}
                  </span>
                )}
                {set.release_date && (
                  <span className="flex items-center gap-0.5">
                    <Calendar className="h-3 w-3" />
                    {set.release_date.slice(0, 4)}
                  </span>
                )}
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

export default CollectionsCarousel;
