import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";

// Fallback static content for MVP guides
const STATIC_GUIDES: Record<string, { title: string; content: string }> = {
  "identificar-holo-reverse": {
    title: "Como identificar Holo/Reverse",
    content: `## Holo vs Reverse Holo

**Holo (Holográfica):** A ilustração da carta possui um brilho holográfico que muda conforme o ângulo da luz. O corpo do texto permanece normal.

**Reverse Holo:** O oposto — a ilustração é normal, mas o restante da carta (borda, corpo de texto) possui o efeito holográfico.

### Dicas rápidas
- Segure a carta sob luz direta e incline lentamente
- Holo: brilho na arte do Pokémon
- Reverse: brilho na moldura e textos
- Verifique o símbolo de raridade no canto inferior esquerdo`,
  },
  "avaliar-condicao": {
    title: "Como avaliar condição da carta",
    content: `## Escala de Condição (Grading)

| Sigla | Nome | Descrição |
|-------|------|-----------|
| NM | Near Mint | Quase perfeita, mínimos sinais de manuseio |
| LP | Lightly Played | Pequenos arranhões ou bordas levemente gastas |
| MP | Moderately Played | Desgaste visível, whitening nas bordas |
| HP | Heavily Played | Danos significativos, dobras ou manchas |
| DMG | Damaged | Rasgos, dobras severas, carta comprometida |

### O que avaliar
1. **Bordas** — Procure whitening (branqueamento)
2. **Superfície** — Arranhões, impressões digitais
3. **Cantos** — Desgaste ou amassados
4. **Centralização** — Bordas simétricas`,
  },
  "anunciar-corretamente": {
    title: "Como anunciar corretamente",
    content: `## Boas práticas para anunciar

1. **Foto real** — Sempre que possível, tire fotos da carta frente e verso
2. **Condição honesta** — Use a escala NM/LP/MP/HP/DMG corretamente
3. **Preço justo** — Pesquise o preço de mercado antes de definir o valor
4. **Idioma correto** — Indique se a carta é PT-BR, EN, JP, etc.
5. **Acabamento** — Especifique: Normal, Holo, Reverse, Full Art, etc.

### Evite
- Fotos genéricas da internet
- Condição superestimada
- Preços muito acima do mercado sem justificativa`,
  },
  "precificar-carta": {
    title: "Como precificar sua carta",
    content: `## Como definir o preço

### Fatores que influenciam
- **Raridade** — Cartas mais raras valem mais
- **Condição** — NM vale significativamente mais que LP/MP
- **Popularidade** — Pokémon icônicos como Charizard são mais procurados
- **Edição** — Primeira edição vs reimpressão
- **Idioma** — PT-BR pode ter preço diferente de EN

### Onde pesquisar
1. Marketplace do TCGHub (seção "a partir de")
2. TCGPlayer (referência internacional)
3. Grupos especializados de compra/venda

### Dica
Precifique ~5-10% abaixo do menor preço ativo para vender mais rápido.`,
  },
};

const GuideDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      if (!slug) return;

      // Try DB first
      const { data } = await supabase
        .from("community_posts")
        .select("title, content")
        .eq("slug", slug)
        .single();

      if (data?.content) {
        setPost({ title: data.title, content: data.content });
      } else {
        // Fallback to static
        setPost(STATIC_GUIDES[slug] ?? null);
      }
      setLoading(false);
    };
    fetchGuide();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Button variant="ghost" size="sm" asChild className="mb-6 gap-1.5 text-muted-foreground">
          <Link to="/comunidade">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Comunidade
          </Link>
        </Button>

        {loading ? (
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        ) : post ? (
          <>
            <div className="mb-8 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">{post.title}</h1>
            </div>
            <article className="prose prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-td:text-muted-foreground prose-th:text-foreground">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
            </article>
          </>
        ) : (
          <div className="py-20 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg text-muted-foreground">Guia não encontrado.</p>
            <Button variant="outline" asChild className="mt-4">
              <Link to="/comunidade">Voltar</Link>
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

// Simple markdown-to-HTML (handles ##, **, |tables|, lists)
function renderMarkdown(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith("- ")) return `<li>${inlineFormat(line.slice(2))}</li>`;
      if (/^\d+\.\s/.test(line)) return `<li>${inlineFormat(line.replace(/^\d+\.\s/, ""))}</li>`;
      if (line.startsWith("|") && line.includes("---")) return "";
      if (line.startsWith("|")) {
        const cells = line.split("|").filter(Boolean).map((c) => c.trim());
        const tag = line.includes("Sigla") || line.includes("Nome") ? "th" : "td";
        return `<tr>${cells.map((c) => `<${tag}>${inlineFormat(c)}</${tag}>`).join("")}</tr>`;
      }
      if (line.trim() === "") return "<br/>";
      return `<p>${inlineFormat(line)}</p>`;
    })
    .join("\n")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table>${match}</table>`);
}

function inlineFormat(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

export default GuideDetail;
