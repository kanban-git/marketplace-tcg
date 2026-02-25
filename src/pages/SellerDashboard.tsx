import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag, Plus, TrendingUp, DollarSign, Star, Eye, Edit2, Power, PowerOff, Loader2, Info,
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
  pending_activation: { label: "Pendente", variant: "secondary" },
  paused: { label: "Pausado", variant: "outline" },
  sold: { label: "Vendido", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

const MIN_ACTIVATION_CENTS = 700;

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch seller listings with card info
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

  const activeListings = (listings || []).filter((l: any) => l.status === "active");
  const pendingListings = (listings || []).filter((l: any) => ["pending_review", "pending_minimum"].includes(l.status));
  const pausedListings = (listings || []).filter((l: any) => l.status === "paused");
  const soldListings = (listings || []).filter((l: any) => l.status === "sold");

  const effectiveValue = (listings || [])
    .filter((l: any) => ["active", "pending_review"].includes(l.status))
    .reduce((s: number, l: any) => s + l.price_cents, 0);
  const totalSold = soldListings.reduce((s: number, l: any) => s + l.price_cents, 0);
  const totalReceived = soldListings.reduce((s: number, l: any) => s + l.net_amount, 0);

  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentListing }: { id: string; currentListing: any }) => {
      if (currentListing.status === "active") {
        // Pause: active -> paused
        const { error } = await supabase
          .from("listings")
          .update({ status: "paused" } as any)
          .eq("id", id)
          .eq("seller_id", user!.id);
        if (error) throw error;
      } else if (currentListing.status === "paused") {
        // Reactivate: paused -> pending_review (if not approved) or active (if approved)
        const newStatus = currentListing.is_approved ? "active" : "pending_review";
        const { error } = await supabase
          .from("listings")
          .update({ status: newStatus } as any)
          .eq("id", id)
          .eq("seller_id", user!.id);
        if (error) throw error;
      }
      // Recalculate minimum status for all user listings
      await supabase.rpc("recalculate_user_minimum_status", { p_user_id: user!.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
      queryClient.invalidateQueries({ queryKey: ["seller-effective-value"] });
      toast.success("Status atualizado!");
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

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Anúncios ativos", value: activeListings.length, icon: ShoppingBag, color: "text-primary" },
            { label: "Valor efetivo", value: formatPrice(effectiveValue), icon: TrendingUp, color: "text-primary" },
            { label: "Total vendido", value: formatPrice(totalSold), icon: DollarSign, color: "text-green-500" },
            { label: "Reputação", value: profile?.reputation_score ?? 0, icon: Star, color: "text-accent" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
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
              {pausedListings.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ou ative anúncios pausados para somar ao valor total.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Listings table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold text-foreground">Meus Anúncios</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !listings || listings.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Nenhum anúncio criado ainda.</p>
              <Button className="mt-4" onClick={() => navigate("/anunciar")}>
                <Plus className="mr-1 h-4 w-4" /> Criar primeiro anúncio
              </Button>
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
                  {listings.map((listing: any) => {
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
                          <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {listing.status === "active" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => toggleStatus.mutate({ id: listing.id, currentListing: listing })}
                                title="Pausar"
                              >
                                <PowerOff className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {listing.status === "paused" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
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
