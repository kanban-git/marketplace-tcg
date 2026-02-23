import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, AlertTriangle, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profilesRes, listingsRes, syncRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id, price_cents, status"),
        supabase.from("sync_status").select("*").order("created_at", { ascending: false }).limit(1),
      ]);

      const listings = listingsRes.data ?? [];
      const activeListings = listings.filter((l) => l.status === "active");
      const totalRevenue = activeListings.reduce((sum, l) => sum + l.price_cents, 0);
      const syncError = syncRes.data?.[0]?.status === "error" ? syncRes.data[0].error_message : null;

      return {
        totalUsers: profilesRes.count ?? 0,
        totalListings: listings.length,
        activeListings: activeListings.length,
        estimatedRevenue: totalRevenue,
        syncError,
      };
    },
  });

  const cards = [
    {
      title: "Usuários",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "Anúncios Ativos",
      value: stats?.activeListings ?? 0,
      subtitle: `${stats?.totalListings ?? 0} total`,
      icon: ShoppingBag,
      color: "text-emerald-400",
    },
    {
      title: "Receita Estimada (5%)",
      value: `R$ ${(((stats?.estimatedRevenue ?? 0) * 0.05) / 100).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-card">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <Card key={c.title} className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{c.value}</div>
                  {c.subtitle && <p className="text-xs text-muted-foreground">{c.subtitle}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {stats?.syncError && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="flex items-center gap-3 pt-6">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Erro no último sync</p>
                  <p className="text-sm text-muted-foreground">{stats.syncError}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
