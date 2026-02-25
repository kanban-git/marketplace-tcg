import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Play, ArrowRight } from "lucide-react";
import SectionHeader from "./SectionHeader";

const mockTournaments = [
  { title: "Liga Pokémon — São Paulo", date: "2026-03-15", location: "SP" },
  { title: "TCG Regional — Rio de Janeiro", date: "2026-03-22", location: "RJ" },
  { title: "Copa Pokémon Online", date: "2026-04-05", location: "Online" },
];

const mockContent = [
  { title: "Top 10 cartas mais valiosas de SV", type: "Artigo" },
  { title: "Como avaliar condição de cartas", type: "Guia" },
  { title: "Meta report — Março 2026", type: "Vídeo" },
];

const CommunityTabs = () => (
  <section id="comunidade">
    <SectionHeader title="Comunidade" icon="🎮" subtitle="Torneios, conteúdo e muito mais" />
    <Tabs defaultValue="torneios" className="rounded-xl border border-border bg-gradient-card p-4">
      <TabsList className="w-full bg-secondary/60">
        <TabsTrigger value="torneios" className="flex-1 gap-1.5 text-xs">
          <Calendar className="h-3.5 w-3.5" />
          Torneios
        </TabsTrigger>
        <TabsTrigger value="conteudo" className="flex-1 gap-1.5 text-xs">
          <Play className="h-3.5 w-3.5" />
          Conteúdo
        </TabsTrigger>
      </TabsList>

      <TabsContent value="torneios" className="mt-4 space-y-3">
        {mockTournaments.map((t, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
            <div>
              <h4 className="text-sm font-medium text-foreground">{t.title}</h4>
              <p className="text-xs text-muted-foreground">{t.date} · {t.location}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
        <button className="w-full rounded-lg border border-border py-2.5 text-center text-xs font-medium text-primary transition-colors hover:bg-secondary/40">
          Ver calendário completo
        </button>
      </TabsContent>

      <TabsContent value="conteudo" className="mt-4 space-y-3">
        {mockContent.map((c, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
            <div>
              <h4 className="text-sm font-medium text-foreground">{c.title}</h4>
              <p className="text-xs text-muted-foreground">{c.type}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
        <button className="w-full rounded-lg border border-border py-2.5 text-center text-xs font-medium text-primary transition-colors hover:bg-secondary/40">
          Ver canal completo
        </button>
      </TabsContent>
    </Tabs>
  </section>
);

export default CommunityTabs;
