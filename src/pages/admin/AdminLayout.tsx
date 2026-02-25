import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, ShoppingBag, ScrollText, ArrowLeft, Image } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/banners", icon: Image, label: "Banners" },
  { to: "/admin/users", icon: Users, label: "Usuários" },
  { to: "/admin/listings", icon: ShoppingBag, label: "Anúncios" },
  { to: "/admin/logs", icon: ScrollText, label: "Audit Log" },
];

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar-background">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <span className="font-display text-lg font-bold text-foreground">
            TCG<span className="text-primary">Hub</span>
          </span>
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            Admin
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <NavLink
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </NavLink>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
