import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronRight, Clock } from "lucide-react";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface SellerGroup {
  seller_id: string;
  seller_name: string;
  count: number;
  total_value: number;
  oldest_date: string;
}

const sortOptions = [
  { value: "oldest", label: "Mais antigos" },
  { value: "newest", label: "Mais recentes" },
  { value: "highest_value", label: "Maior valor" },
  { value: "lowest_value", label: "Menor valor" },
  { value: "most_items", label: "Maior quantidade" },
];

const AdminReviewQueue = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("oldest");

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["admin-review-queue"],
    queryFn: async () => {
      const { data: listings } = await supabase.rpc("admin_list_listings") as any;
      if (!listings) return [];

      const pending = listings.filter((l: any) => l.status === "pending_review");
      if (pending.length === 0) return [];

      const sellerIds = [...new Set(pending.map((l: any) => l.seller_id))] as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", sellerIds);

      const profileMap: Record<string, string> = {};
      profiles?.forEach((p: any) => (profileMap[p.id] = p.display_name));

      const grouped: Record<string, SellerGroup> = {};
      for (const l of pending) {
        if (!grouped[l.seller_id]) {
          grouped[l.seller_id] = {
            seller_id: l.seller_id,
            seller_name: profileMap[l.seller_id] || "Desconhecido",
            count: 0,
            total_value: 0,
            oldest_date: l.created_at,
          };
        }
        grouped[l.seller_id].count++;
        grouped[l.seller_id].total_value += l.price_cents;
        if (l.created_at < grouped[l.seller_id].oldest_date) {
          grouped[l.seller_id].oldest_date = l.created_at;
        }
      }
      return Object.values(grouped);
    },
  });

  const sorted = useMemo(() => {
    const arr = [...groups];
    switch (sortBy) {
      case "newest": return arr.sort((a, b) => b.oldest_date.localeCompare(a.oldest_date));
      case "highest_value": return arr.sort((a, b) => b.total_value - a.total_value);
      case "lowest_value": return arr.sort((a, b) => a.total_value - b.total_value);
      case "most_items": return arr.sort((a, b) => b.count - a.count);
      default: return arr.sort((a, b) => a.oldest_date.localeCompare(b.oldest_date));
    }
  }, [groups, sortBy]);

  const totalPending = groups.reduce((s, g) => s + g.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Fila de Aprovação</h1>
          <p className="text-sm text-muted-foreground">
            {totalPending} anúncio{totalPending !== 1 ? "s" : ""} aguardando revisão
          </p>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-center">Pendentes</TableHead>
              <TableHead>Valor total</TableHead>
              <TableHead>Mais antigo</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum anúncio pendente de aprovação.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((g) => (
                <TableRow key={g.seller_id}>
                  <TableCell className="font-medium text-sm">{g.seller_name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-[10px]">{g.count}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatPrice(g.total_value)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(g.oldest_date).toLocaleDateString("pt-BR")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => navigate(`/admin/reviews/listings/${g.seller_id}`)}
                    >
                      Abrir <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
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

export default AdminReviewQueue;
