import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  Inbox,
  Settings,
  ArrowLeft,
} from "lucide-react";

interface ManageLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/manage", icon: LayoutDashboard },
  { name: "Schedule", href: "/manage/schedule", icon: Calendar },
  { name: "Members", href: "/manage/members", icon: Users },
  { name: "Instructors", href: "/manage/instructors", icon: UserCheck },
  { name: "Billing", href: "/manage/billing", icon: CreditCard },
  { name: "Analytics", href: "/manage/analytics", icon: BarChart3 },
  { name: "Inbox", href: "/manage/inbox", icon: Inbox },
  { name: "Settings", href: "/manage/settings", icon: Settings },
];

export function ManageLayout({ children }: ManageLayoutProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/manage") return location.pathname === "/manage";
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
          <h2 className="text-lg font-bold tracking-tight">Studio Manager</h2>
          <p className="text-xs text-muted-foreground">Manage your studio</p>
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
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
