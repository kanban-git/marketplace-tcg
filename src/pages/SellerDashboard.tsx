import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag, Plus, TrendingUp, DollarSign, Star, Eye, Clock, AlertTriangle,
  Power, PowerOff, Loader2, Info, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Ativo", variant: "default" },
  pending_review: { label: "Em análise", variant: "secondary" },
  pending_minimum: { label: "Pendente (mínimo)", variant: "outline" },
  rejected: { label: "Reprovado", variant: "destructive" },
  paused: { label: "Pausado", variant: "outline" },
  paused_minimum: { label: "Pausado (mínimo)", variant: "destructive" },
  sold: { label: "Vendido", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

const MIN_ACTIVATION_CENTS = 700;

type SortOption = "newest" | "oldest" | "price_high" | "price_low";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["seller-listings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("*, cards(name, number, image_small, image_ptbr, set_id, sets(name, printed_total))")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // KPI calculations
  const all = listings || [];
  const activeValue = all.filter((l: any) => l.status === "active").reduce((s: number, l: any) => s + l.price_cents, 0);
  const activeCount = all.filter((l: any) => l.status === "active").length;
  const approvedValue = all.filter((l: any) => l.is_approved && ["active", "pending_minimum"].includes(l.status)).reduce((s: number, l: any) => s + l.price_cents, 0);
  const approvedCount = all.filter((l: any) => l.is_approved && ["active", "pending_minimum"].includes(l.status)).length;
  const reviewValue = all.filter((l: any) => l.status === "pending_review").reduce((s: number, l: any) => s + l.price_cents, 0);
  const reviewCount = all.filter((l: any) => l.status === "pending_review").length;
  const pausedValue = all.filter((l: any) => ["paused", "paused_minimum"].includes(l.status)).reduce((s: number, l: any) => s + l.price_cents, 0);
  const pausedCount = all.filter((l: any) => ["paused", "paused_minimum"].includes(l.status)).length;
  const soldListings = all.filter((l: any) => l.status === "sold");
  const totalSold = soldListings.reduce((s: number, l: any) => s + l.price_cents, 0);
  const pausedManualListings = all.filter((l: any) => l.status === "paused");

  const effectiveValue = all
    .filter((l: any) => ["active", "pending_review"].includes(l.status))
    .reduce((s: number, l: any) => s + l.price_cents, 0);
  const pendingListings = all.filter((l: any) => ["pending_review", "pending_minimum"].includes(l.status));

  // Filter & sort
  const filtered = all.filter((l: any) => {
    if (statusFilter === "all") return l.status !== "sold";
    return l.status === statusFilter;
  });

  const sorted = [...filtered].sort((a: any, b: any) => {
    switch (sortBy) {
      case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "price_high": return b.price_cents - a.price_cents;
      case "price_low": return a.price_cents - b.price_cents;
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentListing }: { id: string; currentListing: any }) => {
      if (currentListing.status === "active") {
        // Manual pause: active -> paused
        const { error } = await supabase
          .from("listings")
          .update({ status: "paused" } as any)
          .eq("id", id)
          .eq("seller_id", user!.id);
        if (error) throw error;
      } else if (currentListing.status === "paused" || currentListing.status === "paused_minimum") {
        // Reactivate: paused/paused_minimum -> active (if approved) or pending_review
        const newStatus = currentListing.is_approved ? "active" : "pending_review";
        const { error } = await supabase
          .from("listings")
          .update({ status: newStatus } as any)
          .eq("id", id)
          .eq("seller_id", user!.id);
        if (error) throw error;
      }
      // Recalculate: enforces paused_minimum if total < R$7
      const { error: rpcError } = await supabase.rpc("recalculate_user_minimum_status", { p_user_id: user!.id });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
      toast.success("Status atualizado!");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar status: " + (err?.message || "tente novamente"));
    },
  });

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Faça login</h1>
          <p className="mt-2 text-muted-foreground">Acesse sua conta para ver seu painel de vendedor.</p>
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Painel do Vendedor</h1>
            <p className="text-sm text-muted-foreground">Olá, {profile?.display_name ?? "Vendedor"}</p>
          </div>
          <Button onClick={() => navigate("/anunciar")} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo anúncio
          </Button>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span className="text-xs">Valor ativo</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">{formatPrice(activeValue)}</p>
            <p className="text-[10px] text-muted-foreground">{activeCount} anúncio{activeCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-xs">Valor aprovado</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">{formatPrice(approvedValue)}</p>
            <p className="text-[10px] text-muted-foreground">{approvedCount} anúncio{approvedCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4 text-accent" />
              <span className="text-xs">Em análise</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">{formatPrice(reviewValue)}</p>
            <p className="text-[10px] text-muted-foreground">{reviewCount} anúncio{reviewCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs">Valor pausado</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">{formatPrice(pausedValue)}</p>
            <p className="text-[10px] text-muted-foreground">{pausedCount} anúncio{pausedCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs">Total vendido</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">{formatPrice(totalSold)}</p>
            <p className="text-[10px] text-muted-foreground">{soldListings.length} venda{soldListings.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Star className="h-4 w-4 text-accent" />
              <span className="text-xs">Reputação</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">{profile?.reputation_score ?? 0}</p>
          </div>
        </div>

        {/* Activation warning */}
        {pendingListings.length > 0 && effectiveValue < MIN_ACTIVATION_CENTS && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/5 p-4">
            <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground text-sm">Ativação mínima: R$ 7,00</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Faltam {formatPrice(MIN_ACTIVATION_CENTS - effectiveValue)} para seus anúncios serem exibidos no marketplace. Cadastre novos anúncios para atingir o mínimo.
              </p>
              {pausedManualListings.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ou ative anúncios pausados para somar ao valor total.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Listings with filters */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold text-foreground">Meus Anúncios</h2>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="price_high">Maior preço</SelectItem>
                <SelectItem value="price_low">Menor preço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <div className="border-b border-border px-4 overflow-x-auto">
              <TabsList className="bg-transparent h-9 p-0 gap-0">
                {[
                  { value: "all", label: "Todos" },
                  { value: "active", label: "Ativos" },
                  { value: "pending_review", label: "Em análise" },
                  { value: "pending_minimum", label: "Pendente (mínimo)" },
                   { value: "paused", label: "Pausados" },
                   { value: "paused_minimum", label: "Pausado (mínimo)" },
                   { value: "rejected", label: "Reprovados" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-3"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">
                  {statusFilter === "all" ? "Nenhum anúncio criado ainda." : "Nenhum anúncio neste status."}
                </p>
                {statusFilter === "all" && (
                  <Button className="mt-4" onClick={() => navigate("/anunciar")}>
                    <Plus className="mr-1 h-4 w-4" /> Criar primeiro anúncio
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carta</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((listing: any) => {
                      const card = listing.cards;
                      const setData = Array.isArray(card?.sets) ? card.sets[0] : card?.sets;
                      const st = statusLabels[listing.status] || { label: listing.status, variant: "outline" as const };
                      return (
                        <TableRow key={listing.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <img
                                src={card?.image_ptbr || card?.image_small || "/placeholder.svg"}
                                alt={card?.name}
                                className="h-10 w-8 rounded object-contain bg-secondary"
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground truncate max-w-[140px]">{card?.name ?? "—"}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {card?.number}{setData?.name ? ` · ${setData.name}` : ""}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{formatPrice(listing.price_cents)}</TableCell>
                          <TableCell className="text-sm text-destructive">{formatPrice(listing.fee_amount)}</TableCell>
                          <TableCell className="text-sm text-primary font-medium">{formatPrice(listing.net_amount)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                              {listing.status === "paused_minimum" && (
                                <span className="text-[9px] text-muted-foreground max-w-[120px] leading-tight" title="Seus anúncios foram pausados automaticamente porque o valor ativo ficou abaixo de R$7. Ative anúncios adicionais para voltar ao marketplace.">
                                  ⓘ
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {listing.status === "active" && (
                                <Button
                                  variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => toggleStatus.mutate({ id: listing.id, currentListing: listing })}
                                  title="Pausar"
                                >
                                  <PowerOff className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(listing.status === "paused" || listing.status === "paused_minimum") && (
                                <Button
                                  variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => toggleStatus.mutate({ id: listing.id, currentListing: listing })}
                                  title="Reativar"
                                >
                                  <Power className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Tabs>
        </div>

        {/* Sales History */}
        {soldListings.length > 0 && (
          <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-display text-sm font-semibold text-foreground">Histórico de Vendas</h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carta</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Recebido</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soldListings.map((listing: any) => {
                    const card = listing.cards;
                    return (
                      <TableRow key={listing.id}>
                        <TableCell className="text-sm">{card?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{formatPrice(listing.price_cents)}</TableCell>
                        <TableCell className="text-sm text-destructive">{formatPrice(listing.fee_amount)}</TableCell>
                        <TableCell className="text-sm text-primary font-medium">{formatPrice(listing.net_amount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(listing.updated_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
