import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMarketplace, useFilterOptions, type MarketTab, type MarketplaceFilters } from "@/hooks/useMarketplace";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight, Flame, TrendingUp, ArrowDown, ArrowUp, ShoppingBag, X,
} from "lucide-react";

const TABS: { key: MarketTab; label: string; icon: React.ElementType }[] = [
  { key: "popular", label: "Populares", icon: Flame },
  { key: "most_listed", label: "Mais anunciadas", icon: TrendingUp },
  { key: "lowest_price", label: "Menor preço", icon: ArrowDown },
  { key: "highest_price", label: "Maior preço", icon: ArrowUp },
];

const PAGE_SIZE = 24;

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* Horizontally scrollable tabs with fade edges */
const ScrollableTabs = ({ tab, setTab, setPage }: { tab: MarketTab; setTab: (t: MarketTab) => void; setPage: (p: number) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = ref.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => { el?.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, [checkScroll]);

  return (
    <div className="relative mb-4">
      {showLeft && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent" />
      )}
      <div ref={ref} className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(0); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>
      {showRight && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent" />
      )}
    </div>
  );
};

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [tab, setTab] = useState<MarketTab>("popular");
  const [page, setPage] = useState(0);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedSupertypes, setSelectedSupertypes] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [onlyWithListings, setOnlyWithListings] = useState(false);

  const { sets, rarities } = useFilterOptions();

  // Debounce search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (val: string) => {
    setSearch(val);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 400);
    setTimer(t);
  };

  const filters: MarketplaceFilters = useMemo(() => ({
    search: debouncedSearch,
    tab,
    sets: selectedSets,
    rarities: selectedRarities,
    supertypes: selectedSupertypes,
    priceMin: priceMin ? parseFloat(priceMin) : null,
    priceMax: priceMax ? parseFloat(priceMax) : null,
    onlyWithListings,
    page,
    pageSize: PAGE_SIZE,
  }), [debouncedSearch, tab, selectedSets, selectedRarities, selectedSupertypes, priceMin, priceMax, onlyWithListings, page]);

  const { data, isLoading } = useMarketplace(filters);
  const cards = data?.cards || [];
  const totalPages = data?.totalPages || 0;
  const totalCards = data?.total || 0;

  const supertypeOptions = ["Pokémon", "Trainer", "Energy"];

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const activeFiltersCount = selectedSets.length + selectedRarities.length + selectedSupertypes.length + (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (onlyWithListings ? 1 : 0);

  const clearFilters = () => {
    setSelectedSets([]);
    setSelectedRarities([]);
    setSelectedSupertypes([]);
    setPriceMin("");
    setPriceMax("");
    setOnlyWithListings(false);
    setPage(0);
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Only with listings */}
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={onlyWithListings}
          onCheckedChange={(v) => { setOnlyWithListings(!!v); setPage(0); }}
        />
        <span className="text-sm font-medium text-foreground">Somente com anúncios</span>
      </label>

      {/* Supertype */}
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</h4>
        <div className="flex flex-wrap gap-1.5">
          {supertypeOptions.map((s) => (
            <button
              key={s}
              onClick={() => { setSelectedSupertypes(toggleArray(selectedSupertypes, s)); setPage(0); }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedSupertypes.includes(s)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Rarity */}
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Raridade</h4>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-none">
          {rarities.map((r) => (
            <button
              key={r}
              onClick={() => { setSelectedRarities(toggleArray(selectedRarities, r)); setPage(0); }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedRarities.includes(r)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Collection */}
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Coleção</h4>
        <div className="max-h-48 space-y-1 overflow-y-auto scrollbar-none pr-1">
          {sets.map((s: any) => (
            <label key={s.id} className="flex items-center gap-2 cursor-pointer py-0.5">
              <Checkbox
                checked={selectedSets.includes(s.id)}
                onCheckedChange={() => { setSelectedSets(toggleArray(selectedSets, s.id)); setPage(0); }}
              />
              <span className="text-sm text-foreground truncate">{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Faixa de preço (R$)</h4>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => { setPriceMin(e.target.value); setPage(0); }}
            className="h-8 text-sm"
          />
          <Input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => { setPriceMax(e.target.value); setPage(0); }}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-muted-foreground">
          <X className="mr-1 h-3.5 w-3.5" /> Limpar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-6">
        {/* Title + Search */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Encontre cartas e compare preços entre vendedores
          </p>
        </div>

        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, número (252/198), coleção..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Mobile filter button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden shrink-0 relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <FiltersContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Tabs with fade edges */}
        <ScrollableTabs tab={tab} setTab={setTab} setPage={setPage} />

        <div className="flex gap-6">
          {/* Desktop sidebar filters */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
              <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Filtros</h3>
              <FiltersContent />
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            <div className="mb-3 text-xs text-muted-foreground">
              {totalCards} carta{totalCards !== 1 ? "s" : ""} encontrada{totalCards !== 1 ? "s" : ""}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-secondary aspect-[3/4]" />
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 py-16 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">Nenhuma carta encontrada.</p>
                <p className="mt-1 text-sm text-muted-foreground">Tente ajustar os filtros ou a busca.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => navigate(`/pokemon/cards/${card.id}`)}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-glow text-left"
                    >
                      {/* Image */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
                        <img
                          src={card.image_ptbr || card.image_small || "/placeholder.svg"}
                          alt={card.name}
                          className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        {card.active_listings > 0 && (
                          <div className="absolute right-1.5 top-1.5">
                            <Badge className="bg-primary/90 text-primary-foreground text-[10px] px-1.5">
                              {card.active_listings} anúncio{card.active_listings !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col p-3">
                        <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                          {card.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {card.display_number}{card.set_name ? ` · ${card.set_name}` : ""}
                        </p>
                        {card.set_name && (
                          <Badge variant="outline" className="mt-1.5 w-fit text-[10px] px-1.5 py-0">
                            {card.set_name}
                          </Badge>
                        )}
                        <div className="mt-auto pt-2">
                          {card.min_price_cents != null ? (
                            <p className="font-display text-sm font-bold text-primary">
                              a partir de {formatPrice(card.min_price_cents)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Sem anúncios</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;
