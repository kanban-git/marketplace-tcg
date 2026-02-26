import { Plus, User, Menu, LogOut, Shield, ShoppingBag, UserCircle, LogIn, Store, Layers, Package, Puzzle, Users, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Coleções", href: "/colecoes", icon: Layers },
  { label: "Produtos", href: "/produtos", icon: Package },
  { label: "Acessórios", href: "/acessorios", icon: Puzzle },
  { label: "Comunidade", href: "/comunidade", icon: Users },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const { user, profile, isAdmin, signOut } = useAuth();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    await signOut();
    toast.success("Até logo!");
    navigate("/");
  };

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

        {/* Nav links - desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>


        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <Button
                size="sm"
                className="hidden gap-1.5 sm:flex"
                onClick={() => navigate("/anunciar")}
              >
                <Plus className="h-4 w-4" />
                Anunciar
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/notificacoes")}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">{profile?.display_name ?? "Usuário"}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/meu-perfil")}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    Meu perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/meus-anuncios")}>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Meus anúncios
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Entrar
                </Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:flex">
                <Link to="/signup">Criar conta</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
          {/* Nav links - mobile */}
          <nav className="mb-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {user ? (
            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={() => { navigate("/anunciar"); setMenuOpen(false); }}
            >
              <Plus className="h-4 w-4" />
              Anunciar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" className="flex-1" asChild>
                <Link to="/signup">Criar conta</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
