import { Link } from "react-router-dom";
import { Store, Layers, Flame, Clock, Package, Puzzle, Users, Star } from "lucide-react";

const actions = [
  // Linha 1 – Cartas
  { label: "Marketplace", description: "Compre e venda cartas", href: "/marketplace", icon: Store },
  { label: "Coleções", description: "Navegue por expansões", href: "/colecoes", icon: Layers },
  { label: "Cartas em Alta", description: "Ranking das mais buscadas", href: "/trending", icon: Flame },
  { label: "Últimas Anunciadas", description: "Anúncios mais recentes", href: "/marketplace?sort=recent", icon: Clock },
  // Linha 2 – Ecossistema
  { label: "Produtos", description: "Boosters, ETBs e mais", href: "/produtos", icon: Package },
  { label: "Acessórios", description: "Sleeves, binders e decks", href: "/acessorios", icon: Puzzle },
  { label: "Comunidade", description: "Torneios e conteúdo", href: "/comunidade", icon: Users },
  { label: "Vendedores", description: "Lojas em destaque", href: "/vendedores", icon: Star },
];

const QuickActions = () => (
  <section className="container mx-auto px-4">
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-gradient-card p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow sm:flex-row sm:gap-4 sm:text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <action.icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{action.label}</h3>
            <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{action.description}</p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

export default QuickActions;
