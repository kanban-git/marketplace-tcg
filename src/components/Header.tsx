import { Plus, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import SearchAutocomplete from "@/components/SearchAutocomplete";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <button onClick={() => navigate("/")} className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-lg font-bold text-primary-foreground">TG</span>
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            TCG<span className="text-primary">Hub</span>
          </span>
        </button>

        {!isHome && (
          <div className="hidden flex-1 justify-center sm:flex">
            <SearchAutocomplete
              variant="header"
              onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
            />
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
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
          {!isHome && (
            <div className="mb-3">
              <SearchAutocomplete
                variant="header"
                onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
              />
            </div>
          )}
          <Button
            size="sm"
            className="w-full gap-1.5"
            onClick={() => toast.success("Criar anúncio em breve!")}
          >
            <Plus className="h-4 w-4" />
            Anunciar
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
