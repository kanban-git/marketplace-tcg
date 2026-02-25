import { Link } from "react-router-dom";
import { Store, Layers, Flame, Clock, Users } from "lucide-react";

const chips = [
  { label: "Marketplace", href: "#ofertas", icon: Store },
  { label: "Coleções", href: "#colecoes", icon: Layers },
  { label: "Cartas em Alta", href: "#trending", icon: Flame },
  { label: "Últimas Anunciadas", href: "#recentes", icon: Clock },
  { label: "Comunidade", href: "#comunidade", icon: Users },
];

const MiniChipsNav = () => (
  <nav className="flex flex-wrap justify-center gap-2">
    {chips.map((chip) => (
      <a
        key={chip.label}
        href={chip.href}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
      >
        <chip.icon className="h-3.5 w-3.5" />
        {chip.label}
      </a>
    ))}
  </nav>
);

export default MiniChipsNav;
