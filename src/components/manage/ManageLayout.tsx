import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  Upload,
  Bell,
  LogOut,
  User,
  ChevronLeft,
  Menu,
  X,
  CreditCard,
  Tag,
  CalendarHeart,
  Globe,
  Percent,
  Package,
  Warehouse,
  ClipboardList,
  MessageSquare,
  Link2,
  Megaphone,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface ManageLayoutProps {
  children: ReactNode;
}

const manageNavigation = [
  { nameKey: "dashboard", href: "/manage", icon: LayoutDashboard },
  { nameKey: "schedule", href: "/manage/schedule", icon: Calendar },
  { nameKey: "events", href: "/manage/events", icon: CalendarHeart },
  { nameKey: "students", href: "/manage/students", icon: Users },
  { nameKey: "teachers", href: "/manage/teachers", icon: UserCheck },
  { nameKey: "offerings", href: "/manage/offerings", icon: Tag },
  { nameKey: "promoCodes", href: "/manage/promo-codes", icon: Percent },
  { nameKey: "financials", href: "/manage/financials", icon: CreditCard },
  { nameKey: "products", href: "/manage/products", icon: Package },
  { nameKey: "inventory", href: "/manage/inventory", icon: Warehouse },
  { nameKey: "purchaseOrders", href: "/manage/purchase-orders", icon: ClipboardList },
  { nameKey: "landingPages", href: "/manage/landing-pages", icon: Globe },
  { nameKey: "utmBuilder", href: "/manage/utm-builder", icon: Link2 },
  { nameKey: "campaigns", href: "/manage/campaigns", icon: Megaphone },
  { nameKey: "tasks", href: "/manage/tasks", icon: CheckSquare },
  { nameKey: "reports", href: "/manage/reports", icon: BarChart3 },
  { nameKey: "importData", href: "/manage/import", icon: Upload },
  { nameKey: "smsInbox", href: "/manage/sms-inbox", icon: MessageSquare },
  { nameKey: "notifications", href: "/manage/notification-settings", icon: Bell },
  { nameKey: "settings", href: "/manage/settings", icon: Settings },
];

export function ManageLayout({ children }: ManageLayoutProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { t } = useTranslation('manage');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/manage") return location.pathname === "/manage";
    return location.pathname.startsWith(href);
  };

  const profileName = profile?.display_name
    || (profile ? `${profile.first_name} ${profile.last_name}` : "Studio Admin");

  const initials = profileName.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/home" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">{t('studentView')}</span>
            </Link>
            <div className="h-5 w-px bg-border mx-1" />
            <Link to="/manage" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">T</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none">Tandava Yoga</p>
                <p className="text-xs text-muted-foreground">{t('studioManagement')}</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent-coral text-[9px] font-bold text-white flex items-center justify-center">
                5
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/20 text-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 rounded-xl p-2" align="end">
                <div className="flex items-center gap-2 p-2 mb-1">
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold">{profileName}</p>
                    <p className="text-xs text-muted-foreground">{t('owner')}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link to="/account" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    {t('myAccount')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link to="/manage/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    {t('studioSettings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link to="/auth/login" className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" />
                    {t('signOut')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-60 border-r border-border bg-card/95 backdrop-blur-md pt-14 transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex flex-col gap-1 p-3 h-full">
            {manageNavigation.map((item) => (
              <Link
                key={item.nameKey}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {t(`nav.${item.nameKey}`)}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
