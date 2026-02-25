import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, ShoppingBag, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const typeIcons: Record<string, any> = {
  listing_submitted: ShoppingBag,
  listing_approved: CheckCircle,
  listing_rejected: XCircle,
  listing_pending_minimum: AlertTriangle,
  listing_activated: CheckCircle,
  info: Info,
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <Bell className="h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Faça login</h1>
          <p className="mt-2 text-muted-foreground">Acesse sua conta para ver suas notificações.</p>
          <Button className="mt-6" onClick={() => navigate("/login")}>Fazer login</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-6 max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Notificações</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">{unreadCount} não lida{unreadCount > 1 ? "s" : ""}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()} className="gap-1.5">
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Nenhuma notificação.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] || Info;
              return (
                <div
                  key={n.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    n.is_read ? "border-border bg-card" : "border-primary/20 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${n.is_read ? "text-muted-foreground" : "text-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        {!n.is_read && <Badge className="text-[9px] px-1.5 py-0">Nova</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => markAsRead.mutate(n.id)}>
                        Marcar lida
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
