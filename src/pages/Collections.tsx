import Header from "@/components/Header";
import Footer from "@/components/Footer";
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

const ITEMS_PER_PAGE = 30;

const Collections = () => {
  const { data: sets = [], isLoading } = useSets();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const allYears = useMemo(() => {
    const y = new Set(sets.map((s: any) => s.release_date?.slice(0, 4)).filter(Boolean));
    return Array.from(y).sort().reverse() as string[];
  }, [sets]);

  const filtered = useMemo(() => {
    let result = [...sets];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s: any) => s.name.toLowerCase().includes(q));
    }
    if (yearFilter !== "all") {
      result = result.filter((s: any) => s.release_date?.slice(0, 4) === yearFilter);
    }
    return result;
  }, [sets, search, yearFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10">
        <h1 className="mb-1 font-display text-3xl font-bold text-foreground">
          📦 Todas as Coleções
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {filtered.length} coleções encontradas
        </p>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar coleção..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
              className="pl-9"
            />
          </div>
          <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setVisibleCount(ITEMS_PER_PAGE); }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {allYears.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vertical List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((set: any) => {
              const logo = ensureHttps(set.logo);
              const symbol = ensureHttps(set.symbol);
              return (
                <button
                  key={set.id}
                  onClick={() => navigate(`/sets/${set.id}`)}
                  className="group flex w-full items-center gap-4 rounded-lg border border-border bg-gradient-card px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-secondary/40"
                >
                  {logo || symbol ? (
                    <img
                      src={logo || symbol!}
                      alt={set.name}
                      className="h-8 w-auto object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{set.name}</h3>
                    {set.series && (
                      <p className="text-xs text-muted-foreground">{set.series}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {set.printed_total && (
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {set.printed_total}
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
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center pt-6">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
            >
              Carregar mais ({filtered.length - visibleCount} restantes)
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Collections;
