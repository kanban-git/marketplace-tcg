import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminListings = () => {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_list_listings") as any;
      if (!data) return [];

      // Fetch card names and seller names
      const cardIds = [...new Set(data.map((l: any) => l.card_id))];
      const sellerIds = [...new Set(data.map((l: any) => l.seller_id))];

      const [cardsRes, sellersRes] = await Promise.all([
        supabase.from("cards").select("id, name").in("id", cardIds as string[]),
        supabase.from("profiles").select("id, display_name").in("id", sellerIds as string[]),
      ]);

      const cardMap: Record<string, string> = {};
      cardsRes.data?.forEach((c: any) => (cardMap[c.id] = c.name));
      const sellerMap: Record<string, string> = {};
      sellersRes.data?.forEach((s: any) => (sellerMap[s.id] = s.display_name));

      return data.map((l: any) => ({
        ...l,
        card_name: cardMap[l.card_id] ?? l.card_id,
        seller_name: sellerMap[l.seller_id] ?? "Desconhecido",
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      await supabase.from("listings").update({ status: newStatus }).eq("id", id);
      await supabase.from("admin_actions").insert({
        admin_id: currentUser!.id,
        action: newStatus === "removed" ? "remove_listing" : "pause_listing",
        entity_type: "listing",
        entity_id: id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Anúncio atualizado!");
    },
  });

  const statusColor = (s: string) => {
    if (s === "active") return "default";
    if (s === "paused") return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Anúncios</h1>

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
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : listings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum anúncio encontrado.
                </TableCell>
              </TableRow>
            ) : (
              listings.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.card_name}</TableCell>
                  <TableCell>{l.seller_name}</TableCell>
                  <TableCell>R$ {(l.price_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(l.status) as any}>{l.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {l.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ id: l.id, newStatus: "paused" })}
                        >
                          Pausar
                        </Button>
                      )}
                      {l.status !== "removed" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus.mutate({ id: l.id, newStatus: "removed" })}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminListings;
