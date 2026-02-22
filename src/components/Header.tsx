import { Search, Plus, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onCategorySelect: (category: string) => void;
}

const navCategories = [
  { id: "pokemon", label: "Pokémon" },
  { id: "magic", label: "Magic" },
  { id: "yugioh", label: "Yu-Gi-Oh!" },
  { id: "onepiece", label: "One Piece" },
];

const Header = ({ onCategorySelect }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <button onClick={() => onCategorySelect("all")} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-lg font-bold text-primary-foreground">TH</span>
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            TCH<span className="text-primary">Hub</span>
          </span>
        </button>

        <nav className="hidden items-center gap-6 md:flex">
          {navCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {cat.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => toast.info("Use a barra de busca na seção principal para encontrar cartas.")}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => toast("Login em breve!", { description: "Estamos preparando a área de login." })}
          >
            <User className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            className="hidden gap-1.5 sm:flex"
            onClick={() => toast.success("Criar anúncio em breve!", { description: "Essa funcionalidade será liberada em breve." })}
          >
            <Plus className="h-4 w-4" />
            Anunciar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-3">
            {navCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { onCategorySelect(cat.id); setMenuOpen(false); }}
                className="text-left text-sm text-muted-foreground hover:text-foreground"
              >
                {cat.label}
              </button>
            ))}
            <Button
              size="sm"
              className="mt-1 w-full gap-1.5"
              onClick={() => toast.success("Criar anúncio em breve!", { description: "Essa funcionalidade será liberada em breve." })}
            >
              <Plus className="h-4 w-4" />
              Anunciar
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
