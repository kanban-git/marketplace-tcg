import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCards } from "@/hooks/useCards";
import { formatCardSubtitle, formatCollectorNumber } from "@/lib/cardUtils";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, ArrowLeft, ArrowRight, Camera, TrendingUp, ShoppingBag, Info, Check, Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { calculateSellerFee, getSellerFeeLabel, type AccountType } from "@/lib/feeUtils";
const MIN_ACTIVATION_CENTS = 700; // 7 BRL

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CONDITIONS = [
  { value: "NM", label: "Near Mint (NM)" },
  { value: "LP", label: "Lightly Played (LP)" },
  { value: "MP", label: "Moderately Played (MP)" },
  { value: "HP", label: "Heavily Played (HP)" },
  { value: "DMG", label: "Damaged (DMG)" },
];

const LANGUAGES = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
  { value: "jp", label: "日本語" },
];

const FINISHES = [
  { value: "normal", label: "Normal" },
  { value: "foil", label: "Foil" },
  { value: "reverse", label: "Reverse Foil" },
];

interface SelectedCard {
  id: string;
  name: string;
  number: string | null;
  rarity: string | null;
  image_small: string | null;
  image_ptbr: string | null;
  set_name: string | null;
  printed_total: number | null;
  avg_price: number | null;
  min_price: number | null;
  active_listings: number;
}

const CreateListing = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const accountType: AccountType = (profile as any)?.account_type ?? "individual";
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);

  // Step 2 state
  const [condition, setCondition] = useState("NM");
  const [language, setLanguage] = useState("pt");
  const [finish, setFinish] = useState("normal");
  const [priceBrl, setPriceBrl] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  const handleSearch = (val: string) => {
    setSearch(val);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedSearch(val), 350);
    setTimer(t);
  };

  // Search cards — reuse the same hook/logic as Home
  const { data: rawSearchResults, isLoading: searching } = useCards(debouncedSearch, 20);
  const searchResults = useMemo(() => {
    if (!rawSearchResults) return undefined;
    return rawSearchResults.map((card) => ({
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      image_small: card.image_small,
      image_ptbr: card.image_ptbr,
      set_name: card.set_name,
      printed_total: card.printed_total ?? null,
      collection_number: card.collection_number,
    }));
  }, [rawSearchResults]);

  // Fetch market stats for selected card
  const { data: marketStats } = useQuery({
    queryKey: ["card-market-stats", selectedCard?.id],
    queryFn: async () => {
      if (!selectedCard) return null;
      const { data } = await (supabase as any)
        .from("card_market_stats")
        .select("*")
        .eq("card_id", selectedCard.id)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedCard,
  });

  const cardWithStats = useMemo(() => {
    if (!selectedCard) return null;
    return {
      ...selectedCard,
      avg_price: marketStats?.avg_price_cents ?? null,
      min_price: marketStats?.min_price_cents ?? null,
      active_listings: marketStats?.offers_count ?? 0,
    };
  }, [selectedCard, marketStats]);

  const priceCents = Math.round(parseFloat(priceBrl || "0") * 100);
  const { feeCents, netCents } = calculateSellerFee(priceCents, accountType);

  // Check current effective value (active + pending_review) for activation rule
  const { data: sellerStats } = useQuery({
    queryKey: ["seller-effective-value", user?.id],
    queryFn: async () => {
      if (!user) return { effectiveValue: 0, hasPaused: false };
      const { data } = await supabase
        .from("listings")
        .select("price_cents, status")
        .eq("seller_id", user.id)
        .in("status", ["active", "pending_review"]);
      const effectiveValue = (data || [])
        .reduce((sum: number, l: any) => sum + l.price_cents, 0);
      return { effectiveValue, hasPaused: false };
    },
    enabled: !!user,
  });

  const currentEffectiveValue = sellerStats?.effectiveValue || 0;
  const hasPausedListings = sellerStats?.hasPaused || false;
  const totalAfter = currentEffectiveValue + priceCents;
  const meetsMinimum = totalAfter >= MIN_ACTIVATION_CENTS;

  // Determine initial status: always pending_review (admin must approve)
  // but if total < 7, it goes to pending_minimum first
  const initialStatus = meetsMinimum ? "pending_review" : "pending_minimum";

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedCard) throw new Error("Missing data");
      const { data: inserted, error } = await supabase.from("listings").insert({
        card_id: selectedCard.id,
        entity_type: "card",
        entity_id: selectedCard.id,
        seller_id: user.id,
        price_cents: priceCents,
        fee_amount: feeCents,
        net_amount: netCents,
        quantity: parseInt(quantity) || 1,
        condition,
        language,
        finish,
        notes: notes || null,
        status: initialStatus,
        is_test: false,
        is_approved: false,
      } as any).select("id").single();
      if (error) throw error;

      // Recalculate all user listings after creation
      await supabase.rpc("recalculate_user_minimum_status", { p_user_id: user.id });

      // Create notification
      const { createNotification } = await import("@/hooks/useNotifications");
      if (initialStatus === "pending_review") {
        await createNotification({
          user_id: user.id,
          title: "Anúncio enviado para análise",
          message: `Seu anúncio de "${selectedCard.name}" será revisado por um administrador.`,
          type: "listing_submitted",
          entity_type: "listing",
          entity_id: inserted?.id,
        });
      } else {
        const falta = formatPrice(MIN_ACTIVATION_CENTS - totalAfter);
        await createNotification({
          user_id: user.id,
          title: "Anúncio pendente: mínimo não atingido",
          message: `Faltam ${falta} em anúncios para ativar. Seu anúncio de "${selectedCard.name}" ficará pendente.`,
          type: "listing_pending_minimum",
          entity_type: "listing",
          entity_id: inserted?.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["seller"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Anúncio criado!", {
        description: initialStatus === "pending_review"
          ? "Seu anúncio será revisado por um administrador antes de ser publicado."
          : `Pendente: faltam ${formatPrice(MIN_ACTIVATION_CENTS - totalAfter)} para atingir o mínimo de R$ 7,00.`,
      });
      navigate("/meus-anuncios");
    },
    onError: (err: any) => {
      toast.error("Erro ao criar anúncio", { description: err.message });
    },
  });

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Faça login para anunciar</h1>
          <p className="mt-2 text-muted-foreground">Você precisa estar logado para criar anúncios.</p>
          <Button className="mt-6" onClick={() => navigate("/login")}>Fazer login</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Anunciar Carta</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {step === 1 ? "Selecione a carta que deseja anunciar" : "Preencha os detalhes do anúncio"}
        </p>

        {/* Steps indicator */}
        <div className="mb-8 flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {step > 1 ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <div className={`h-0.5 w-12 ${step > 1 ? "bg-primary" : "bg-secondary"}`} />
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            2
          </div>
        </div>

        {step === 1 && (
          <div className="max-w-2xl">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou número (152/198)..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Future: Camera button */}
            <Button variant="outline" size="sm" disabled className="mb-6 gap-1.5 opacity-50">
              <Camera className="h-4 w-4" />
              Reconhecer pela câmera
              <Badge variant="outline" className="ml-1 text-[10px]">Em breve</Badge>
            </Button>

            {/* Search results */}
            {searching && <p className="text-sm text-muted-foreground">Buscando...</p>}
            {searchResults && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((card: any) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      setSelectedCard(card);
                      setStep(2);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/30 hover:shadow-glow ${
                      selectedCard?.id === card.id ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <img
                      src={card.image_ptbr || card.image_small || "/placeholder.svg"}
                      alt={card.name}
                      className="h-16 w-12 rounded object-contain bg-secondary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{card.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCardSubtitle(card.number, card.printed_total, card.set_name)}
                      </p>
                      {card.rarity && (
                        <Badge variant="outline" className="mt-1 text-[10px]">{card.rarity}</Badge>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {searchResults && searchResults.length === 0 && debouncedSearch.length >= 2 && (
              <p className="text-sm text-muted-foreground">Nenhuma carta encontrada.</p>
            )}
          </div>
        )}

        {step === 2 && cardWithStats && (
          <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
            {/* Card preview */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex gap-4">
                <img
                  src={cardWithStats.image_ptbr || cardWithStats.image_small || "/placeholder.svg"}
                  alt={cardWithStats.name}
                  className="h-48 w-auto rounded-lg object-contain bg-secondary p-2"
                />
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-foreground">{cardWithStats.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatCollectorNumber(cardWithStats.number, cardWithStats.printed_total)}
                  </p>
                  {cardWithStats.set_name && (
                    <Badge variant="outline" className="mt-1 text-[10px]">{cardWithStats.set_name}</Badge>
                  )}
                  {cardWithStats.rarity && (
                    <Badge variant="outline" className="mt-1 ml-1 text-[10px]">{cardWithStats.rarity}</Badge>
                  )}

                  {/* Market stats */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>
                        {cardWithStats.avg_price != null
                          ? `Preço médio: ${formatPrice(cardWithStats.avg_price)}`
                          : "Sem dados de preço"}
                      </span>
                    </div>
                    {cardWithStats.min_price != null && (
                      <p className="text-xs text-muted-foreground">
                        Menor preço: {formatPrice(cardWithStats.min_price)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {cardWithStats.active_listings} anúncio{cardWithStats.active_listings !== 1 ? "s" : ""} ativo{cardWithStats.active_listings !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <Button variant="ghost" size="sm" className="mt-4 text-muted-foreground" onClick={() => { setStep(1); setSelectedCard(null); }}>
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Trocar carta
              </Button>
            </div>

            {/* Form */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Condição</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Idioma</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Acabamento</Label>
                  <Select value={finish} onValueChange={setFinish}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FINISHES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Preço (R$)</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Ex: 15.00"
                  value={priceBrl}
                  onChange={(e) => setPriceBrl(e.target.value)}
                  className="mt-1 text-lg font-bold"
                />
              </div>

              {priceCents > 0 && (
                <div className="rounded-lg bg-secondary/50 p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa do vendedor ({getSellerFeeLabel(accountType)})</span>
                    <span className="text-destructive font-medium">-{formatPrice(feeCents)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <span className="text-foreground font-medium">Você receberá</span>
                    <span className="text-primary font-bold">{formatPrice(netCents)}</span>
                  </div>
                </div>
              )}

              {/* Activation warning */}
              {priceCents > 0 && (
                <div className={`flex items-start gap-2 rounded-lg p-3 border ${
                  !meetsMinimum ? "bg-accent/10 border-accent/20" : "bg-primary/5 border-primary/20"
                }`}>
                  <Info className={`h-4 w-4 shrink-0 mt-0.5 ${!meetsMinimum ? "text-accent" : "text-primary"}`} />
                  <div className="text-xs text-muted-foreground">
                    {!meetsMinimum ? (
                      <>
                        <p className="font-medium text-foreground">Ativação mínima: {formatPrice(MIN_ACTIVATION_CENTS)}</p>
                        <p>Faltam {formatPrice(MIN_ACTIVATION_CENTS - totalAfter)} para seus anúncios serem exibidos no marketplace. Cadastre novos anúncios para atingir o mínimo.</p>
                        {false && (
                          <p className="mt-1">Ou ative anúncios pausados para somar ao valor total.</p>
                        )}
                      </>
                    ) : (
                      <p className="font-medium text-foreground">Anúncio será enviado para aprovação de um administrador.</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs">Observações (opcional)</Label>
                <Textarea
                  placeholder="Ex: Carta em perfeito estado, sleeve inclusa..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>

              <Button
                className="w-full"
                disabled={priceCents <= 0 || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {meetsMinimum ? "Enviar para aprovação" : "Criar anúncio (pendente)"}
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CreateListing;
