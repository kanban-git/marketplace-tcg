import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Users, ShoppingBag, AlertTriangle, TrendingUp, FlaskConical, XCircle, Clock, MousePointerClick, UserCheck } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const queryClient = useQueryClient();

  // Dev mode setting
  const { data: analyticsPaused = false } = useQuery({
    queryKey: ["app-settings-analytics-paused"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("value")
        .eq("key", "analytics_paused")
        .maybeSingle();
      return (data as any)?.value === true;
    },
  });

  const toggleDevMode = useMutation({
    mutationFn: async (paused: boolean) => {
      const { error } = await (supabase as any)
        .from("app_settings")
        .update({ value: paused, updated_at: new Date().toISOString() })
        .eq("key", "analytics_paused");
      if (error) throw error;
    },
    onSuccess: (_, paused) => {
      queryClient.invalidateQueries({ queryKey: ["app-settings-analytics-paused"] });
      toast.success(paused ? "Modo Dev ativado – analytics pausado" : "Modo Dev desativado – analytics ativo");
    },
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profilesRes, listingsRes, syncRes, analyticsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id, price_cents, status, seller_id"),
        supabase.from("sync_status").select("*").order("created_at", { ascending: false }).limit(1),
        (supabase as any)
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_name", "listing_buy_click"),
      ]);

      const listings = listingsRes.data ?? [];
      const activeListings = listings.filter((l) => l.status === "active");
      const pendingListings = listings.filter((l) => l.status === "pending_review");
      const rejectedListings = listings.filter((l) => l.status === "rejected");
      const totalRevenue = activeListings.reduce((sum, l) => sum + l.price_cents, 0);
      const sellersWithListings = new Set(listings.map((l: any) => l.seller_id)).size;
      const syncError = syncRes.data?.[0]?.status === "error" ? syncRes.data[0].error_message : null;

      const buyClicks = analyticsRes.count ?? 0;
      const avgClicksPerListing = activeListings.length > 0
        ? (buyClicks / activeListings.length).toFixed(1)
        : "0";

      return {
        totalUsers: profilesRes.count ?? 0,
        totalListings: listings.length,
        activeListings: activeListings.length,
        pendingListings: pendingListings.length,
        rejectedListings: rejectedListings.length,
        estimatedRevenue: totalRevenue,
        avgBuyClicks: avgClicksPerListing,
        sellersWithListings,
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
      title: "Usuários com Anúncios",
      value: stats?.sellersWithListings ?? 0,
      icon: UserCheck,
      color: "text-cyan-400",
    },
    {
      title: "Anúncios Ativos",
      value: stats?.activeListings ?? 0,
      icon: ShoppingBag,
      color: "text-emerald-400",
    },
    {
      title: "Total de Anúncios",
      value: stats?.totalListings ?? 0,
      icon: ShoppingBag,
      color: "text-muted-foreground",
    },
    {
      title: "Em Aprovação",
      value: stats?.pendingListings ?? 0,
      icon: Clock,
      color: "text-yellow-400",
    },
    {
      title: "Reprovados",
      value: stats?.rejectedListings ?? 0,
      icon: XCircle,
      color: "text-destructive",
    },
    {
      title: "Receita Estimada (10%)",
      value: `R$ ${(((stats?.estimatedRevenue ?? 0) * 0.10) / 100).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "Cliques médios em Comprar",
      value: stats?.avgBuyClicks ?? "0",
      subtitle: "por anúncio ativo",
      icon: MousePointerClick,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Dev Mode Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Modo Dev: pausar analytics</p>
            <p className="text-xs text-muted-foreground">Quando ativo, nenhum evento de analytics é salvo</p>
          </div>
        </div>
        <Switch
          checked={analyticsPaused}
          onCheckedChange={(v) => toggleDevMode.mutate(v)}
          disabled={toggleDevMode.isPending}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
