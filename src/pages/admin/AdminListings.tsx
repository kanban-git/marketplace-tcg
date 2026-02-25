import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Ativo", variant: "default" },
  pending_review: { label: "Aguardando aprovação", variant: "secondary" },
  pending_minimum: { label: "Pendente (mínimo)", variant: "outline" },
  rejected: { label: "Reprovado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
  paused: { label: "Pausado", variant: "outline" },
  sold: { label: "Vendido", variant: "default" },
  removed: { label: "Removido", variant: "destructive" },
};

const AdminListings = () => {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending_review");
  const [rejectDialog, setRejectDialog] = useState<{ id: string; sellerId: string; cardName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailDialog, setDetailDialog] = useState<any>(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_list_listings") as any;
      if (!data) return [];

      const cardIds = [...new Set(data.map((l: any) => l.card_id))];
      const sellerIds = [...new Set(data.map((l: any) => l.seller_id))];

      const [cardsRes, sellersRes] = await Promise.all([
        supabase.from("cards").select("id, name, image_small, image_ptbr").in("id", cardIds as string[]),
        supabase.from("profiles").select("id, display_name").in("id", sellerIds as string[]),
      ]);

      const cardMap: Record<string, any> = {};
      cardsRes.data?.forEach((c: any) => (cardMap[c.id] = c));
      const sellerMap: Record<string, string> = {};
      sellersRes.data?.forEach((s: any) => (sellerMap[s.id] = s.display_name));

      return data.map((l: any) => ({
        ...l,
        card: cardMap[l.card_id] ?? { name: l.card_id },
        seller_name: sellerMap[l.seller_id] ?? "Desconhecido",
      }));
    },
  });

  // Calculate seller totals for activation check
  const sellerTotals = listings.reduce((acc: Record<string, number>, l: any) => {
    if (l.status === "active") {
      acc[l.seller_id] = (acc[l.seller_id] || 0) + l.price_cents;
    }
    return acc;
  }, {});

  const approveMutation = useMutation({
    mutationFn: async ({ id, sellerId, cardName }: { id: string; sellerId: string; cardName: string }) => {
      const sellerTotal = sellerTotals[sellerId] || 0;
      const meetsMinimum = sellerTotal >= 700;
      const newStatus = meetsMinimum ? "active" : "pending_minimum";

      await supabase.from("listings").update({
        status: newStatus,
        approved_at: new Date().toISOString(),
        approved_by: currentUser!.id,
      } as any).eq("id", id);

      await supabase.from("admin_actions").insert({
        admin_id: currentUser!.id,
        action: "approve_listing",
        entity_type: "listing",
        entity_id: id,
      });

      // If active, also activate any other approved pending_minimum listings
      if (meetsMinimum) {
        await supabase.from("listings").update({ status: "active" } as any)
          .eq("seller_id", sellerId)
          .eq("status", "pending_minimum")
          .not("approved_at", "is", null);

        await createNotification({
          user_id: sellerId,
          title: "Anúncio aprovado!",
          message: `Seu anúncio de "${cardName}" foi aprovado e está ativo no marketplace.`,
          type: "listing_approved",
          entity_type: "listing",
          entity_id: id,
        });
      } else {
        await createNotification({
          user_id: sellerId,
          title: "Anúncio aprovado (pendente mínimo)",
          message: `Seu anúncio de "${cardName}" foi aprovado, mas será ativado quando seus anúncios atingirem R$ 7,00.`,
          type: "listing_approved",
          entity_type: "listing",
          entity_id: id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Anúncio aprovado!");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, sellerId, cardName, reason }: { id: string; sellerId: string; cardName: string; reason: string }) => {
      await supabase.from("listings").update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        rejected_by: currentUser!.id,
        rejection_reason: reason,
      } as any).eq("id", id);

      await supabase.from("admin_actions").insert({
        admin_id: currentUser!.id,
        action: "reject_listing",
        entity_type: "listing",
        entity_id: id,
        metadata: { reason },
      });

      await createNotification({
        user_id: sellerId,
        title: "Anúncio reprovado",
        message: `Seu anúncio de "${cardName}" foi reprovado. Motivo: ${reason}`,
        type: "listing_rejected",
        entity_type: "listing",
        entity_id: id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      setRejectDialog(null);
      setRejectReason("");
      toast.success("Anúncio reprovado.");
    },
  });

  const filtered = listings.filter((l: any) => l.status === tab);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Anúncios</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="pending_review" className="gap-1.5">
            Pendentes
            <Badge variant="secondary" className="text-[10px] ml-1">
              {listings.filter((l: any) => l.status === "pending_review").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending_minimum">Mínimo</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="rejected">Reprovados</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carta</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum anúncio nesta categoria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((l: any) => {
                    const st = statusConfig[l.status] || { label: l.status, variant: "outline" as const };
                    return (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img
                              src={l.card?.image_ptbr || l.card?.image_small || "/placeholder.svg"}
                              alt={l.card?.name}
                              className="h-10 w-8 rounded object-contain bg-secondary"
                            />
                            <span className="text-sm font-medium truncate max-w-[140px]">{l.card?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{l.seller_name}</TableCell>
                        <TableCell className="text-sm font-medium">{formatPrice(l.price_cents)}</TableCell>
                        <TableCell>
                          <Badge variant={st.variant as any} className="text-[10px]">{st.label}</Badge>
                          {l.is_test && <Badge variant="outline" className="ml-1 text-[10px]">Teste</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Detalhes" onClick={() => setDetailDialog(l)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {(l.status === "pending_review") && (
                              <>
                                <Button
                                  variant="ghost" size="icon" className="h-7 w-7 text-green-600"
                                  title="Aprovar"
                                  disabled={approveMutation.isPending}
                                  onClick={() => approveMutation.mutate({ id: l.id, sellerId: l.seller_id, cardName: l.card?.name })}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                  title="Reprovar"
                                  onClick={() => setRejectDialog({ id: l.id, sellerId: l.seller_id, cardName: l.card?.name })}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do anúncio</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <img src={detailDialog.card?.image_ptbr || detailDialog.card?.image_small || "/placeholder.svg"} className="h-24 w-auto rounded bg-secondary" />
                <div>
                  <p className="font-semibold">{detailDialog.card?.name}</p>
                  <p className="text-muted-foreground">{detailDialog.seller_name}</p>
                  <p className="font-bold text-primary mt-1">{formatPrice(detailDialog.price_cents)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Condição:</span> {detailDialog.condition}</div>
                <div><span className="text-muted-foreground">Idioma:</span> {detailDialog.language}</div>
                <div><span className="text-muted-foreground">Acabamento:</span> {detailDialog.finish}</div>
                <div><span className="text-muted-foreground">Qtd:</span> {detailDialog.quantity}</div>
              </div>
              {detailDialog.notes && <p className="text-xs bg-secondary/50 rounded p-2">{detailDialog.notes}</p>}
              {detailDialog.rejection_reason && (
                <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
                  Motivo: {detailDialog.rejection_reason}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprovar anúncio</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Informe o motivo da reprovação:</p>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Motivo..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason(""); }}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => rejectDialog && rejectMutation.mutate({
                id: rejectDialog.id,
                sellerId: rejectDialog.sellerId,
                cardName: rejectDialog.cardName,
                reason: rejectReason,
              })}
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminListings;
