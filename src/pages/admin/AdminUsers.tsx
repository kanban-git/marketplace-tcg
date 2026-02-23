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

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.rpc("admin_list_profiles") as any;
      if (!profiles) return [];

      // Fetch roles for all users
      const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap: Record<string, string[]> = {};
      allRoles?.forEach((r: any) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      });

      return profiles.map((p: any) => ({
        ...p,
        roles: roleMap[p.id] ?? ["user"],
      }));
    },
  });

  const logAction = async (action: string, entityType: string, entityId: string, metadata = {}) => {
    await supabase.from("admin_actions").insert({
      admin_id: currentUser!.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  };

  const toggleBan = useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string; currentStatus: string }) => {
      const newStatus = currentStatus === "active" ? "banned" : "active";
      await supabase.from("profiles").update({ status: newStatus }).eq("id", userId);
      await logAction(newStatus === "banned" ? "ban" : "unban", "user", userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Status atualizado!");
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, isCurrentlyAdmin }: { userId: string; isCurrentlyAdmin: boolean }) => {
      if (isCurrentlyAdmin) {
        await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      } else {
        await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      }
      await logAction(isCurrentlyAdmin ? "remove_admin" : "grant_admin", "user", userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role atualizada!");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Usuários</h1>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Criado em</TableHead>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u: any) => {
                const isSelf = u.id === currentUser?.id;
                const isAdmin = u.roles.includes("admin");
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.display_name}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === "active" ? "default" : "destructive"}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {u.roles.map((r: string) => (
                          <Badge key={r} variant="secondary" className="text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isSelf && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleBan.mutate({ userId: u.id, currentStatus: u.status })}
                          >
                            {u.status === "active" ? "Banir" : "Desbanir"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAdmin.mutate({ userId: u.id, isCurrentlyAdmin: isAdmin })}
                          >
                            {isAdmin ? "Remover admin" : "Tornar admin"}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
