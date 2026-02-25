import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Play, BookOpen, ExternalLink, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Tournament {
  id: string;
  name: string;
  date: string;
  city: string | null;
  state: string | null;
  type: string;
  description: string | null;
  video_url: string | null;
  is_featured: boolean;
}

interface CommunityPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string | null;
  thumbnail: string | null;
  created_at: string;
}

// Static videos for MVP
const YOUTUBE_VIDEOS = [
  {
    id: "1",
    title: "Como montar seu primeiro deck competitivo",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    url: "https://youtube.com",
  },
  {
    id: "2",
    title: "Top 10 cartas mais valiosas de 2026",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    url: "https://youtube.com",
  },
  {
    id: "3",
    title: "Análise do novo set Prismatic Evolutions",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    url: "https://youtube.com",
  },
];

// Static guides for MVP
const GUIDES = [
  { title: "Como identificar Holo/Reverse", slug: "identificar-holo-reverse", icon: "✨" },
  { title: "Como avaliar condição da carta", slug: "avaliar-condicao", icon: "🔍" },
  { title: "Como anunciar corretamente", slug: "anunciar-corretamente", icon: "📝" },
  { title: "Como precificar sua carta", slug: "precificar-carta", icon: "💰" },
];

const Community = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [featured, setFeatured] = useState<Tournament | null>(null);
  const [guides, setGuides] = useState<CommunityPost[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [tournamentsRes, guidesRes] = await Promise.all([
        supabase
          .from("tournaments")
          .select("*")
          .gte("date", new Date().toISOString())
          .order("date", { ascending: true })
          .limit(6),
        supabase
          .from("community_posts")
          .select("*")
          .eq("category", "guide")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (tournamentsRes.data) {
        const feat = tournamentsRes.data.find((t) => t.is_featured) || null;
        setFeatured(feat);
        setTournaments(tournamentsRes.data.filter((t) => t.id !== feat?.id));
      }
      if (guidesRes.data) setGuides(guidesRes.data);
    };
    fetchData();
  }, []);

  const scrollToTournaments = () => {
    document.getElementById("torneios")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="container relative mx-auto px-4 py-20 text-center md:py-28">
          <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1 text-xs font-medium">
            <Trophy className="h-3.5 w-3.5" />
            Hub da Comunidade
          </Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Comunidade <span className="text-gradient-gold">TCGHub</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Torneios, vídeos e guias para evoluir no Pokémon TCG.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={scrollToTournaments} className="gap-2">
              <Trophy className="h-4 w-4" />
              Ver próximos torneios
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                <Play className="h-4 w-4" />
                Acessar canal
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* TORNEIOS */}
      <section id="torneios" className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Torneios</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Upcoming list */}
          <div className="space-y-3 lg:col-span-3">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Próximos torneios
            </h3>
            {tournaments.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Trophy className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Nenhum torneio agendado no momento.</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Volte em breve para novidades!</p>
                </CardContent>
              </Card>
            )}
            {tournaments.map((t) => (
              <Card key={t.id} className="transition-colors hover:border-primary/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{t.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(t.date), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                      {(t.city || t.state) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[t.city, t.state].filter(Boolean).join(", ")}
                        </span>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{t.type}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0 gap-1 text-xs">
                    Detalhes <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Featured tournament */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Torneio da semana
            </h3>
            {featured ? (
              <Card className="overflow-hidden border-primary/20 shadow-glow">
                {featured.video_url && (
                  <div className="aspect-video bg-muted">
                    <img
                      src={`https://img.youtube.com/vi/${extractYoutubeId(featured.video_url)}/hqdefault.jpg`}
                      alt={featured.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-5">
                  <Badge className="mb-2">Destaque</Badge>
                  <h4 className="font-display text-lg font-bold text-foreground">{featured.name}</h4>
                  {featured.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{featured.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(featured.date), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                    {(featured.city || featured.state) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[featured.city, featured.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                  {featured.video_url && (
                    <Button size="sm" className="mt-4 w-full gap-2" asChild>
                      <a href={featured.video_url} target="_blank" rel="noopener noreferrer">
                        <Play className="h-4 w-4" />
                        Assistir agora
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Play className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Nenhum torneio em destaque.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* VÍDEOS RECENTES */}
      <section className="border-t border-border bg-card/30">
        <div className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Vídeos Recentes</h2>
            </div>
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                Ver todos <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {YOUTUBE_VIDEOS.map((v) => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="overflow-hidden transition-all hover:border-primary/30 hover:shadow-glow">
                  <div className="relative aspect-video bg-muted">
                    <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
                        <Play className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="font-medium text-foreground line-clamp-2">{v.title}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* GUIAS E TUTORIAIS */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Guias e Tutoriais</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* DB guides first, then fallback static */}
          {(guides.length > 0 ? guides : GUIDES.map((g, i) => ({ id: String(i), title: g.title, slug: g.slug, category: "guide", content: null, thumbnail: null, created_at: "" }))).map((g) => {
            const staticGuide = GUIDES.find((sg) => sg.slug === g.slug);
            return (
              <Link key={g.id} to={`/guia/${g.slug}`}>
                <Card className="h-full transition-all hover:border-primary/30 hover:shadow-glow">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <span className="mb-3 text-4xl">{staticGuide?.icon ?? "📖"}</span>
                    <p className="font-medium text-foreground">{g.title}</p>
                    <span className="mt-2 text-xs text-primary">Ler guia →</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
};

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:v=|\/)([\w-]{11})/);
  return match?.[1] ?? "";
}

export default Community;
