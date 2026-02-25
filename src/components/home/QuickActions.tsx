import { Link } from "react-router-dom";
import { Layers, Flame, Clock, Users } from "lucide-react";

const actions = [
  {
    label: "Coleções",
    description: "Navegue por todas as expansões",
    href: "/colecoes",
    icon: Layers,
  },
  {
    label: "Cartas em Alta",
    description: "Ranking das mais procuradas",
    href: "/trending",
    icon: Flame,
  },
  {
    label: "Últimas Anunciadas",
    description: "Anúncios mais recentes",
    href: "/marketplace?sort=recent",
    icon: Clock,
  },
  {
    label: "Comunidade",
    description: "Torneios e conteúdo",
    href: "/comunidade",
    icon: Users,
  },
];

const QuickActions = () => (
  <section className="container mx-auto px-4">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          className="group flex items-center gap-4 rounded-xl border border-border bg-gradient-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <action.icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{action.label}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

export default QuickActions;
