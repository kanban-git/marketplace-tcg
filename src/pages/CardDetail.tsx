import { useParams, useNavigate } from "react-router-dom";
import {
  useCardDetail,
  useCardListings,
  useCardMarketStats,
} from "@/hooks/useCards";
import { useCart, type CartItem } from "@/hooks/useCart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowLeft,
  Tag,
  TrendingUp,
  ShoppingBag,
  MapPin,
  Star,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type SortMode = "price" | "reputation" | "recent";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const conditionLabel: Record<string, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  Damaged: "Damaged",
};

const languageLabel: Record<string, string> = {
  pt: "PT",
  en: "EN",
  jp: "JP",
  "Português": "PT",
  "Inglês": "EN",
  "Japonês": "JP",
};

const finishLabel: Record<string, string> = {
  normal: "Normal",
  foil: "Foil",
  reverse_foil: "Reverse Foil",
};

const LANGUAGE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "pt", label: "PT" },
  { value: "en", label: "EN" },
  { value: "jp", label: "JP" },
];

const FINISH_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "normal", label: "Normal" },
  { value: "foil", label: "Foil" },
  { value: "reverse_foil", label: "Reverse Foil" },
];

const CONDITION_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "NM", label: "NM" },
  { value: "LP", label: "LP" },
  { value: "MP", label: "MP" },
  { value: "HP", label: "HP" },
  { value: "Damaged", label: "Damaged" },
];

const CardDetail = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortMode>("price");
  const [filterLang, setFilterLang] = useState("");
  const [filterFinish, setFilterFinish] = useState("");
  const [filterCondition, setFilterCondition] = useState("");

  const { data: card, isLoading: loadingCard } = useCardDetail(cardId);
  const { data: listings = [], isLoading: loadingListings } =
    useCardListings(cardId);
  const { data: stats } = useCardMarketStats(cardId);
  const cart = useCart();

  useEffect(() => {
    if (cardId) trackEvent("view_card_market", { entity_type: "card", entity_id: cardId });
  }, [cardId]);

  const filteredListings = listings.filter((l: any) => {
    if (filterLang && (languageLabel[l.language] || l.language) !== languageLabel[filterLang] && l.language !== filterLang) return false;
    if (filterFinish && (l.finish || "normal") !== filterFinish) return false;
    if (filterCondition && l.condition !== filterCondition) return false;
    return true;
  });

  const sortedListings = [...filteredListings].sort((a: any, b: any) => {
    if (sort === "price") return a.price_cents - b.price_cents;
    if (sort === "reputation")
      return (
        (b.profiles?.reputation_score || 0) -
        (a.profiles?.reputation_score || 0)
      );
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  const handleBuy = (listing: any) => {
    trackEvent("click_buy_now", { entity_type: "card", entity_id: cardId });
    const item: CartItem = {
      listingId: listing.id,
      cardName: card?.name || "",
      cardImage: card?.image_ptbr || card?.image_small || "",
      priceCents: listing.price_cents,
      quantity: 1,
      maxQuantity: listing.quantity,
      sellerId: listing.seller_id,
      sellerName: listing.profiles?.display_name || "Vendedor",
      condition: listing.condition,
    };
    cart.addItem(item);
  };

  if (loadingCard) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="container mx-auto flex-1 px-4 py-10">
          <div className="h-96 animate-pulse rounded-xl bg-secondary" />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="container mx-auto flex-1 px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Carta não encontrada.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        {/* Card Hero */}
        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          <div className="mx-auto w-full max-w-xs lg:max-w-none">
            <img
              src={(card as any).image_ptbr || card.image_large || card.image_small || ""}
              alt={card.name}
              className="w-full rounded-xl border border-border shadow-card"
            />
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {card.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {card.set_name && <span>{card.set_name}</span>}
              {card.collection_number && (
                <span>· #{card.collection_number}</span>
              )}
              {card.rarity && card.rarity !== "Unknown" && (
                <span>· {card.rarity}</span>
              )}
              {card.supertype && <span>· {card.supertype}</span>}
              {card.types && card.types.length > 0 && (
                <span>· {card.types.join(", ")}</span>
              )}
            </div>

            {/* Market Stats */}
            {stats && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-gradient-card p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" />
                    Menor preço
                  </div>
                  <p className="mt-1 font-display text-lg font-bold text-primary">
                    {formatPrice(stats.min_price_cents)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-gradient-card p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Preço médio
                  </div>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">
                    {formatPrice(stats.avg_price_cents)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-gradient-card p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Ofertas
                  </div>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">
                    {stats.offers_count}
                  </p>
                </div>
              </div>
            )}

            {/* Offers */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Ofertas desta carta
                </h2>
                <div className="flex gap-1">
                  {(
                    [
                      ["price", "Menor preço"],
                      ["reputation", "Reputação"],
                      ["recent", "Recentes"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSort(key)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        sort === key
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 space-y-3">
                {[
                  { label: "Idioma", options: LANGUAGE_OPTIONS, value: filterLang, set: setFilterLang },
                  { label: "Acabamento", options: FINISH_OPTIONS, value: filterFinish, set: setFilterFinish },
                  { label: "Condição", options: CONDITION_OPTIONS, value: filterCondition, set: setFilterCondition },
                ].map(({ label, options, value, set }) => {
                  // Count listings per option
                  const counts: Record<string, number> = {};
                  for (const l of listings as any[]) {
                    let key = "";
                    if (label === "Idioma") key = languageLabel[l.language] || l.language || "PT";
                    else if (label === "Acabamento") key = l.finish || "normal";
                    else key = l.condition;
                    counts[key] = (counts[key] || 0) + 1;
                  }

                  return (
                    <div key={label}>
                      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {label}
                      </span>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {options.map((o) => {
                          const isActive = value === o.value;
                          // Resolve count key
                          let countKey = o.value;
                          if (label === "Idioma" && o.value) countKey = o.label;
                          const count = o.value ? counts[countKey] || 0 : (listings as any[]).length;

                          return (
                            <button
                              key={o.value}
                              onClick={() => set(isActive ? "" : o.value)}
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                              }`}
                            >
                              {o.label}
                              {count > 0 && (
                                <span className={`text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                                  ({count})
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {loadingListings ? (
                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-secondary"
                    />
                  ))}
                </div>
              ) : sortedListings.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/30 py-12 text-center">
                  <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    Nenhuma oferta disponível.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Seja o primeiro a anunciar esta carta!
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Vendedor
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Detalhes
                        </th>
                        <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground sm:table-cell">
                          Qtd
                        </th>
                        <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                          Local
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          Preço
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedListings.map((listing: any) => (
                        <tr
                          key={listing.id}
                          className="border-b border-border last:border-0 hover:bg-secondary/30"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {listing.profiles?.display_name || "Vendedor"}
                              </span>
                              {listing.profiles?.reputation_score > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-primary">
                                  <Star className="h-3 w-3" />
                                  {listing.profiles.reputation_score}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {languageLabel[listing.language] || listing.language || "PT"}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {finishLabel[listing.finish] || listing.finish || "Normal"}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {listing.condition}
                              </Badge>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-center text-muted-foreground sm:table-cell">
                            {listing.quantity}
                          </td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {listing.city && listing.state
                                ? `${listing.city}, ${listing.state}`
                                : listing.profiles?.city
                                ? `${listing.profiles.city}, ${listing.profiles.state}`
                                : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-display font-bold text-primary">
                            {formatPrice(listing.price_cents)}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              onClick={() => handleBuy(listing)}
                              className="gap-1"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Comprar</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CardDetail;
