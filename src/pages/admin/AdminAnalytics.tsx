import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Eye, Search, ShoppingCart, Image, Download, ExternalLink, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type Preset = "1d" | "7d" | "30d" | "all" | "custom";

const presetMs: Record<string, number> = {
  "1d": 86400000,
  "7d": 604800000,
  "30d": 2592000000,
};

interface CardInfo {
  id: string;
  name: string;
  number: string | null;
  set_id: string | null;
  sets?: { name: string; printed_total: number | null } | null;
}

interface SetInfo {
  id: string;
  name: string;
}

const AdminAnalytics = () => {
  const [preset, setPreset] = useState<Preset>("7d");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const effectiveRange = useMemo(() => {
    if (preset === "custom" && dateFrom) {
      const from = dateFrom.toISOString();
      const to = dateTo ? new Date(dateTo.getTime() + 86400000 - 1).toISOString() : new Date().toISOString();
      return { from, to };
    }
    if (preset === "all") return { from: null, to: null };
    const ms = presetMs[preset] || presetMs["7d"];
    return { from: new Date(Date.now() - ms).toISOString(), to: null };
  }, [preset, dateFrom, dateTo]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["analytics-events", effectiveRange],
    queryFn: async () => {
      let q = (supabase as any)
        .from("analytics_events")
        .select("event_name, entity_type, entity_id, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (effectiveRange.from) q = q.gte("created_at", effectiveRange.from);
      if (effectiveRange.to) q = q.lte("created_at", effectiveRange.to);
      const { data, error } = await q;
      if (error) throw error;
      return data as { event_name: string; entity_type: string | null; entity_id: string | null; created_at: string; metadata: any }[];
    },
  });

  // Collect unique card/set IDs for enrichment
  const cardIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of events) {
      if ((e.event_name === "view_card_market" || e.event_name === "click_buy_now") && e.entity_id) ids.add(e.entity_id);
    }
    return [...ids];
  }, [events]);

  const setIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of events) {
      if (e.event_name === "view_collection" && e.entity_id) ids.add(e.entity_id);
    }
    return [...ids];
  }, [events]);

  const { data: cardsMap = {} } = useQuery({
    queryKey: ["analytics-cards-info", cardIds],
    enabled: cardIds.length > 0,
    queryFn: async () => {
      const map: Record<string, CardInfo> = {};
      // Fetch in batches of 50
      for (let i = 0; i < cardIds.length; i += 50) {
        const batch = cardIds.slice(i, i + 50);
        const { data } = await (supabase as any)
          .from("cards")
          .select("id, name, number, set_id, sets(name, printed_total)")
          .in("id", batch);
        if (data) {
          for (const c of data) {
            const s = Array.isArray(c.sets) ? c.sets[0] : c.sets;
            map[c.id] = { ...c, sets: s };
          }
        }
      }
      return map;
    },
  });

  const { data: setsMap = {} } = useQuery({
    queryKey: ["analytics-sets-info", setIds],
    enabled: setIds.length > 0,
    queryFn: async () => {
      const map: Record<string, SetInfo> = {};
      const { data } = await (supabase as any)
        .from("sets")
        .select("id, name")
        .in("id", setIds);
      if (data) for (const s of data) map[s.id] = s;
      return map;
    },
  });

  const overview = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) counts[e.event_name] = (counts[e.event_name] || 0) + 1;
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

  const handlePreset = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") {
      setDateFrom(undefined);
      setDateTo(undefined);
    }
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

  const formatCardDisplay = (id: string) => {
    const card = cardsMap[id];
    if (!card) return { name: id, sub: "", number: "", link: `/pokemon/cards/${id}?noTrack=1` };
    const pt = card.sets?.printed_total;
    const num = card.number && pt ? `${card.number.padStart(2, "0")}/${pt}` : card.number || "";
    const setName = card.sets?.name || "";
    return {
      name: card.name,
      sub: [setName, num].filter(Boolean).join(" · "),
      number: num,
      link: `/pokemon/cards/${id}?noTrack=1`,
    };
  };

  const formatSetDisplay = (id: string) => {
    const set = setsMap[id];
    return {
      name: set?.name || id,
      sub: set ? id : "",
      link: `/sets/${id}?noTrack=1`,
    };
  };

  const CardRankingTable = ({ rows, eventLabel }: { rows: { id: string; count: number }[]; eventLabel: string }) => (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">#</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Carta</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">{eventLabel}</th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Sem dados no período.</td></tr>
          ) : rows.map((r, i) => {
            const d = formatCardDisplay(r.id);
            return (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">{d.name}</span>
                  {d.sub && <span className="ml-2 text-xs text-muted-foreground">{d.sub}</span>}
                </td>
                <td className="px-4 py-3 text-right font-display font-bold text-primary">{r.count}</td>
                <td className="px-4 py-3">
                  <Link to={d.link} className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const SetRankingTable = ({ rows }: { rows: { id: string; count: number }[] }) => (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">#</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Coleção</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Views</th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Sem dados no período.</td></tr>
          ) : rows.map((r, i) => {
            const d = formatSetDisplay(r.id);
            return (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">{d.name}</span>
                  {d.sub && <span className="ml-2 text-xs text-muted-foreground">{d.sub}</span>}
                </td>
                <td className="px-4 py-3 text-right font-display font-bold text-primary">{r.count}</td>
                <td className="px-4 py-3">
                  <Link to={d.link} className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const DatePicker = ({ value, onChange, placeholder }: { value?: Date; onChange: (d: Date | undefined) => void; placeholder: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-1 h-3.5 w-3.5" />
          {value ? format(value, "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={(d) => d > new Date()}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Métricas de uso da plataforma</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["1d", "7d", "30d", "all"] as Preset[]).map((p) => (
            <Button key={p} size="sm" variant={preset === p ? "default" : "outline"} onClick={() => handlePreset(p)}>
              {p === "all" ? "All" : p}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground">ou</span>
          <DatePicker value={dateFrom} onChange={(d) => { setDateFrom(d); setPreset("custom"); }} placeholder="De" />
          <DatePicker value={dateTo} onChange={(d) => { setDateTo(d); setPreset("custom"); }} placeholder="Até" />
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
              <Button size="sm" variant="outline" onClick={() => exportCsv(topCards, `top-cards-${preset}.csv`)}>
                <Download className="mr-1 h-3.5 w-3.5" /> CSV
              </Button>
            </div>
            <CardRankingTable rows={topCards} eventLabel="Views" />

            <h2 className="font-display text-lg font-bold text-foreground">Clicks "Comprar" por carta</h2>
            <CardRankingTable rows={topBuyClicks} eventLabel="Clicks" />
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Views por coleção</h2>
            <SetRankingTable rows={topCollections} />
          </TabsContent>

          <TabsContent value="banners" className="space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">Clicks por banner</h2>
            <CardRankingTable rows={topBanners} eventLabel="Clicks" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminAnalytics;
