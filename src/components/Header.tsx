import { Search, Plus, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-lg font-bold text-primary-foreground">TC</span>
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Trade<span className="text-primary">Cards</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pokémon
          </a>
          <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Magic
          </a>
          <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Yu-Gi-Oh!
          </a>
          <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            One Piece
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <User className="h-5 w-5" />
          </Button>
          <Button size="sm" className="hidden gap-1.5 sm:flex">
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
            <a href="#" className="text-sm text-muted-foreground">Pokémon</a>
            <a href="#" className="text-sm text-muted-foreground">Magic</a>
            <a href="#" className="text-sm text-muted-foreground">Yu-Gi-Oh!</a>
            <a href="#" className="text-sm text-muted-foreground">One Piece</a>
            <Button size="sm" className="mt-1 w-full gap-1.5">
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
