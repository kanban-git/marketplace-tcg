import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User, ShoppingBag, Store, Star, MapPin, Shield, Bell, LogOut,
  Package, Heart, ChevronRight, Loader2,
} from "lucide-react";
import { censorDocument } from "@/lib/validators";

type Section = "resumo" | "colecao" | "compras" | "reputacao" | "enderecos" | "dados" | "seguranca" | "notificacoes";

const menuItems: { id: Section; label: string; icon: any }[] = [
  { id: "resumo", label: "Resumo", icon: User },
  { id: "colecao", label: "Minha coleção", icon: Heart },
  { id: "compras", label: "Minhas compras", icon: Package },
  { id: "reputacao", label: "Reputação", icon: Star },
  { id: "enderecos", label: "Endereços", icon: MapPin },
  { id: "dados", label: "Dados da conta", icon: User },
  { id: "seguranca", label: "Segurança", icon: Shield },
  { id: "notificacoes", label: "Notificações", icon: Bell },
];

const MyProfile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const [section, setSection] = useState<Section>("resumo");

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <User className="h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Faça login</h1>
          <p className="mt-2 text-muted-foreground">Acesse sua conta para ver seu perfil.</p>
          <Button className="mt-6" onClick={() => navigate("/login")}>Fazer login</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const accountType = (profile as any)?.account_type ?? "individual";
  const accountLabel = accountType === "business" ? "Lojista" : "Pessoa Física";
  const doc = (profile as any)?.document ?? (profile as any)?.cpf ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Meu Perfil</h1>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="rounded-xl border border-border bg-card p-2 space-y-0.5">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    section === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {section === "resumo" && (
              <div className="space-y-4">
                {/* User card */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {accountType === "business" ? <Store className="h-7 w-7" /> : <User className="h-7 w-7" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display text-lg font-bold text-foreground">{profile?.display_name ?? "Usuário"}</h2>
                      <Badge variant="outline" className="mt-1 text-[10px]">{accountLabel}</Badge>
                    </div>
                  </div>
                </div>

                {/* Info cards */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground mb-1">Documento ({accountType === "business" ? "CNPJ" : "CPF"})</p>
                    <p className="text-sm font-medium text-foreground">{censorDocument(doc, accountType)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground mb-1">Reputação</p>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-accent" />
                      <p className="text-sm font-medium text-foreground">{profile?.reputation_score ?? 0}</p>
                      <Badge variant="outline" className="text-[9px] ml-1">Em breve</Badge>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground mb-1">Taxa do vendedor</p>
                    <p className="text-sm font-medium text-foreground">
                      {accountType === "business" ? "2%" : "5%"}
                    </p>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => navigate("/meus-anuncios")} className="gap-1.5">
                    <ShoppingBag className="h-4 w-4" />
                    Ver meus anúncios
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/marketplace")} className="gap-1.5">
                    <Store className="h-4 w-4" />
                    Ver marketplace
                  </Button>
                </div>
              </div>
            )}

            {section !== "resumo" && (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  {menuItems.find(m => m.id === section)?.icon && (
                    (() => {
                      const Icon = menuItems.find(m => m.id === section)!.icon;
                      return <Icon className="h-6 w-6 text-muted-foreground" />;
                    })()
                  )}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {menuItems.find(m => m.id === section)?.label}
                </h3>
                <p className="text-sm text-muted-foreground">Em breve — esta seção está em desenvolvimento.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyProfile;
