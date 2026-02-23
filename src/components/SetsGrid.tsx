import { useSets } from "@/hooks/useCards";
import { useNavigate } from "react-router-dom";
import { Calendar, Layers, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

function ensureHttps(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//i, "https://");
}

const SetImage = ({ set }: { set: any }) => {
  const [useFallback, setUseFallback] = useState<"logo" | "symbol" | "placeholder">("logo");

  const logoUrl = ensureHttps(set.logo);
  const symbolUrl = ensureHttps(set.symbol);

  if (useFallback === "placeholder" || (!logoUrl && !symbolUrl)) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <Layers className="h-6 w-6 text-primary" />
      </div>
    );
  }

  if (useFallback === "symbol") {
    if (!symbolUrl) {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Layers className="h-6 w-6 text-primary" />
        </div>
      );
    }
    return (
      <img
        src={symbolUrl}
        alt={set.name}
        className="h-12 w-auto object-contain transition-transform group-hover:scale-110"
        loading="lazy"
        onError={() => setUseFallback("placeholder")}
      />
    );
  }

  return (
    <img
      src={logoUrl!}
      alt={set.name}
      className="h-12 w-auto object-contain transition-transform group-hover:scale-110"
      loading="lazy"
      onError={() => setUseFallback(symbolUrl ? "symbol" : "placeholder")}
    />
  );
};

const ITEMS_PER_PAGE = 24;

const SetsGrid = () => {
  const { data: sets = [], isLoading } = useSets();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const allSeries = useMemo(() => {
    const s = new Set(sets.map((set: any) => set.series).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [sets]);

  const allYears = useMemo(() => {
    const y = new Set(
      sets
        .map((set: any) => set.release_date?.slice(0, 4))
        .filter(Boolean)
    );
    return Array.from(y).sort().reverse() as string[];
  }, [sets]);

  const filtered = useMemo(() => {
    let result = [...sets];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s: any) => s.name.toLowerCase().includes(q));
    }
    if (seriesFilter !== "all") {
      result = result.filter((s: any) => s.series === seriesFilter);
    }
    if (yearFilter !== "all") {
      result = result.filter(
        (s: any) => s.release_date?.slice(0, 4) === yearFilter
      );
    }

    if (sortBy === "name") {
      result.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
    // "date" is already the default order from the query

    return result;
  }, [sets, search, seriesFilter, yearFilter, sortBy]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-secondary" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} coleções
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar coleção..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
            className="pl-9"
          />
        </div>
        <Select value={seriesFilter} onValueChange={(v) => { setSeriesFilter(v); setVisibleCount(ITEMS_PER_PAGE); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Série" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as séries</SelectItem>
            {allSeries.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setVisibleCount(ITEMS_PER_PAGE); }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {allYears.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v as any); setVisibleCount(ITEMS_PER_PAGE); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Mais recentes</SelectItem>
            <SelectItem value="name">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((set: any) => (
          <button
            key={set.id}
            onClick={() => navigate(`/sets/${set.id}`)}
            className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-gradient-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
          >
            <SetImage set={set} />
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

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
          >
            Carregar mais ({filtered.length - visibleCount} restantes)
          </Button>
        </div>
      )}
    </div>
  );
};

export default SetsGrid;
