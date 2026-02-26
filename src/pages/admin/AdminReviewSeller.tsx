import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const AdminReviewSeller = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const qc = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ id: string; cardName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailDialog, setDetailDialog] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-review-seller", sellerId],
    queryFn: async () => {
      const { data: allListings } = await supabase.rpc("admin_list_listings") as any;
      const sellerListings = (allListings || []).filter(
        (l: any) => l.seller_id === sellerId && l.status === "pending_review"
      );

      const cardIds = [...new Set(sellerListings.map((l: any) => l.card_id))] as string[];
      const [cardsRes, profileRes] = await Promise.all([
        cardIds.length > 0
          ? supabase.from("cards").select("id, name, image_small, image_ptbr").in("id", cardIds)
          : Promise.resolve({ data: [] }),
        supabase.from("profiles").select("id, display_name").eq("id", sellerId!).single(),
      ]);

      const cardMap: Record<string, any> = {};
      cardsRes.data?.forEach((c: any) => (cardMap[c.id] = c));

      // Calculate effective value for this seller
      const allSellerListings = (allListings || []).filter((l: any) => l.seller_id === sellerId);
      const effectiveValue = allSellerListings
        .filter((l: any) => ["active", "pending_review"].includes(l.status))
        .reduce((s: number, l: any) => s + l.price_cents, 0);

      return {
        listings: sellerListings.map((l: any) => ({
          ...l,
          card: cardMap[l.card_id] ?? { name: l.card_id },
        })),
        sellerName: profileRes.data?.display_name || "Desconhecido",
        effectiveValue,
      };
    },
    enabled: !!sellerId,
  });

  const listings = data?.listings || [];
  const sellerName = data?.sellerName || "";
  const effectiveValue = data?.effectiveValue || 0;

  const approveMutation = useMutation({
    mutationFn: async ({ id, cardName }: { id: string; cardName: string }) => {
      const { data: result, error } = await supabase.rpc("admin_approve_listing", {
        p_listing_id: id,
        p_admin_id: adminUser!.id,
      } as any);
      if (error) throw error;

      const newStatus = (result as any)?.status;
      const meetsMinimum = newStatus === "active";

      await createNotification({
        user_id: sellerId!,
        title: meetsMinimum ? "Anúncio aprovado!" : "Anúncio aprovado (pendente mínimo)",
        message: meetsMinimum
          ? `Seu anúncio de "${cardName}" foi aprovado e está publicado no marketplace.`
          : `Seu anúncio de "${cardName}" foi aprovado, mas aguarda o valor mínimo de R$ 7,00 para aparecer no marketplace.`,
        type: "listing_approved",
        entity_type: "listing",
        entity_id: id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-review-seller", sellerId] });
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Anúncio aprovado!");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, cardName, reason }: { id: string; cardName: string; reason: string }) => {
      const { error } = await supabase.rpc("admin_reject_listing", {
        p_listing_id: id,
        p_admin_id: adminUser!.id,
        p_reason: reason,
      } as any);
      if (error) throw error;

      await createNotification({
        user_id: sellerId!,
        title: "Anúncio reprovado",
        message: `Seu anúncio de "${cardName}" foi reprovado. Motivo: ${reason}`,
        type: "listing_rejected",
        entity_type: "listing",
        entity_id: id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-review-seller", sellerId] });
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      setRejectDialog(null);
      setRejectReason("");
      toast.success("Anúncio reprovado.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/listings")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{sellerName}</h1>
          <p className="text-sm text-muted-foreground">
            {listings.length} anúncio{listings.length !== 1 ? "s" : ""} pendente{listings.length !== 1 ? "s" : ""} · Valor efetivo: {formatPrice(effectiveValue)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Carta</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead>Idioma</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : listings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum anúncio pendente para este vendedor.
                </TableCell>
              </TableRow>
            ) : (
              listings.map((l: any) => (
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
                  <TableCell className="text-sm font-medium">{formatPrice(l.price_cents)}</TableCell>
                  <TableCell className="text-sm">{l.condition}</TableCell>
                  <TableCell className="text-sm">{l.language}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailDialog(l)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-green-600"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate({ id: l.id, cardName: l.card?.name })}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => setRejectDialog({ id: l.id, cardName: l.card?.name })}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do anúncio</DialogTitle></DialogHeader>
          {detailDialog && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <img src={detailDialog.card?.image_ptbr || detailDialog.card?.image_small || "/placeholder.svg"} className="h-24 w-auto rounded bg-secondary" />
                <div>
                  <p className="font-semibold">{detailDialog.card?.name}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectReason(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reprovar anúncio</DialogTitle></DialogHeader>
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

export default AdminReviewSeller;
