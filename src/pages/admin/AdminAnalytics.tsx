import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, Eye, Search, ShoppingCart, Image, Download } from "lucide-react";

type Period = "1d" | "7d" | "30d";

const periodMs: Record<Period, number> = {
  "1d": 86400000,
  "7d": 604800000,
  "30d": 2592000000,
};

const AdminAnalytics = () => {
  const [period, setPeriod] = useState<Period>("7d");

  const since = useMemo(() => {
    return new Date(Date.now() - periodMs[period]).toISOString();
  }, [period]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["analytics-events", period],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("analytics_events")
        .select("event_name, entity_type, entity_id, created_at, metadata")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data as { event_name: string; entity_type: string | null; entity_id: string | null; created_at: string; metadata: any }[];
    },
  });

  const overview = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.event_name] = (counts[e.event_name] || 0) + 1;
    }
    return counts;
  }, [events]);

  const topByEvent = (eventName: string) => {
    const counts: Record<string, number> = {};
    for (const e of events) {
      if (e.event_name !== eventName || !e.entity_id) continue;
      counts[e.entity_id] = (counts[e.entity_id] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id, count]) => ({ id, count }));
  };

  const topCards = useMemo(() => topByEvent("view_card_market"), [events]);
  const topBuyClicks = useMemo(() => topByEvent("click_buy_now"), [events]);
  const topCollections = useMemo(() => topByEvent("view_collection"), [events]);
  const topBanners = useMemo(() => topByEvent("click_banner"), [events]);

  const exportCsv = (rows: { id: string; count: number }[], filename: string) => {
    const csv = "entity_id,count\n" + rows.map((r) => `${r.id},${r.count}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
    <div className="rounded-xl border border-border bg-gradient-card p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value.toLocaleString("pt-BR")}</p>
    </div>
  );

  const RankingTable = ({ rows, label }: { rows: { id: string; count: number }[]; label: string }) => (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">{label}</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Views</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Sem dados no período.</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-foreground">{r.id}</td>
                <td className="px-4 py-3 text-right font-display font-bold text-primary">{r.count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Métricas de uso da plataforma</p>
        </div>
        <div className="flex gap-1">
          {(["1d", "7d", "30d"] as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />)}
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cards">Top Cards</TabsTrigger>
            <TabsTrigger value="collections">Top Coleções</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Eye} label="Views de cartas" value={overview["view_card_market"] || 0} />
              <StatCard icon={Search} label="Buscas" value={overview["search_marketplace"] || 0} />
              <StatCard icon={ShoppingCart} label="Clicks Comprar" value={overview["click_buy_now"] || 0} />
              <StatCard icon={Image} label="Clicks Banner" value={overview["click_banner"] || 0} />
            </div>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Views por carta</h2>
              <Button size="sm" variant="outline" onClick={() => exportCsv(topCards, `top-cards-${period}.csv`)}>
                <Download className="mr-1 h-3.5 w-3.5" /> CSV
              </Button>
            </div>
            <RankingTable rows={topCards} label="Card ID" />

            <h2 className="font-display text-lg font-bold text-foreground">Clicks "Comprar" por carta</h2>
            <RankingTable rows={topBuyClicks} label="Card ID" />
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Views por coleção</h2>
            <RankingTable rows={topCollections} label="Set ID" />
          </TabsContent>

          <TabsContent value="banners" className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Clicks por banner</h2>
            <RankingTable rows={topBanners} label="Banner ID" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminAnalytics;
