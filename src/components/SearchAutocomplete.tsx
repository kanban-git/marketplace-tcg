import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CardSuggestion {
  id: string;
  name: string;
  number: string | null;
  setName: string;
  setTotal: number;
  releaseYear: number | null;
  image: string | null;
  minPriceCents: number | null;
  offersCount: number;
}

interface SetSuggestion {
  id: string;
  name: string;
  total: number;
  year: number | null;
  logo: string | null;
}

interface SuggestResponse {
  cards: CardSuggestion[];
  sets: SetSuggestion[];
}

interface Props {
  onSearch: (query: string) => void;
}

const SearchAutocomplete = ({ onSearch }: Props) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const navigate = useNavigate();

  // Update dropdown position relative to form
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  const totalItems = suggestions
    ? Math.min(suggestions.cards.length, 6) + suggestions.sets.length
    : 0;

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions(null);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "flskgtwqbbwcrlxfaujk";
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc2tndHdxYmJ3Y3JseGZhdWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODkxNjAsImV4cCI6MjA4NzM2NTE2MH0.ngclKd35U2Mhb7nDD_EQR3feO0DaOk__fbdESEoWshg";
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/search-suggest?q=${encodeURIComponent(q)}`,
        {
          headers: {
            apikey: anonKey,
          },
        }
      );
      const data: SuggestResponse = await res.json();
      setSuggestions(data);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      setSuggestions(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (type: "card" | "set", id: string) => {
    setIsOpen(false);
    setQuery("");
    if (type === "card") navigate(`/pokemon/cards/${id}`);
    else navigate(`/sets/${id}`);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (activeIndex >= 0 && suggestions) {
      const cardLen = Math.min(suggestions.cards.length, 6);
      if (activeIndex < cardLen) {
        handleSelect("card", suggestions.cards[activeIndex].id);
      } else {
        handleSelect("set", suggestions.sets[activeIndex - cardLen].id);
      }
      return;
    }
    if (query.trim()) {
      setIsOpen(false);
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || totalItems === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  };

  const ensureHttps = (url: string | null) =>
    url?.replace("http://", "https://") || null;

  return (
    <div ref={containerRef} className="relative mx-auto mt-8 max-w-lg animate-fade-in [animation-delay:200ms]">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-card"
      >
        <Search className="ml-4 h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar cartas, coleções, vendedores..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions && query.length >= 2) setIsOpen(true);
          }}
          className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />}
        <button
          type="submit"
          className="m-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Buscar
        </button>
      </form>

      {/* Dropdown via Portal */}
      {isOpen && suggestions && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
          }}
          className="max-h-[320px] overflow-y-auto rounded-xl border border-border bg-popover shadow-lg"
        >
          {suggestions.cards.length === 0 && suggestions.sets.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          )}

          {/* Cards */}
          {suggestions.cards.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                Cartas
              </div>
              {suggestions.cards.slice(0, 6).map((card, i) => (
                <button
                  key={card.id}
                  onClick={() => handleSelect("card", card.id)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-secondary ${
                    activeIndex === i ? "bg-secondary" : ""
                  }`}
                >
                  <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-muted">
                    {ensureHttps(card.image) ? (
                      <img
                        src={ensureHttps(card.image)!}
                        alt={card.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">?</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {card.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {card.number && `${card.number}/${card.setTotal}`}{" "}
                      · {card.setName}
                      {card.releaseYear && ` (${card.releaseYear})`}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {card.minPriceCents && card.minPriceCents > 0 ? (
                      <div className="text-xs font-semibold text-primary">
                        A partir de {formatPrice(card.minPriceCents)}
                      </div>
                    ) : null}
                    {card.offersCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {card.offersCount} oferta{card.offersCount > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* "Ver mais" link */}
          {suggestions.cards.length > 6 && (
            <button
              onClick={() => { setIsOpen(false); onSearch(query.trim()); }}
              className="w-full border-t border-border px-3 py-2.5 text-center text-xs font-medium text-primary hover:bg-secondary transition-colors"
            >
              Ver mais resultados...
            </button>
          )}

          {/* Sets */}
          {suggestions.sets.length > 0 && (
            <div>
              <div className="border-t border-border px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                Coleções
              </div>
              {suggestions.sets.map((set, i) => {
                const idx = Math.min(suggestions.cards.length, 6) + i;
                return (
                  <button
                    key={set.id}
                    onClick={() => handleSelect("set", set.id)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-secondary ${
                      activeIndex === idx ? "bg-secondary" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-muted p-1">
                      {ensureHttps(set.logo) ? (
                        <img
                          src={ensureHttps(set.logo)!}
                          alt={set.name}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">📦</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {set.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {set.total} cartas{set.year ? ` · ${set.year}` : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchAutocomplete;
