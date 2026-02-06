import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Megaphone,
  MessageSquare,
  Settings,
  ArrowLeft,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Studios", href: "/admin/studios", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 p-4 flex flex-col">
        <div className="mb-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
          <h2 className="text-lg font-bold tracking-tight">Platform Admin</h2>
          <p className="text-xs text-muted-foreground">Manage your Tandava instance</p>
        </div>

        <nav className="space-y-1 flex-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Instance: {import.meta.env.VITE_APP_NAME || "Tandava"}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
