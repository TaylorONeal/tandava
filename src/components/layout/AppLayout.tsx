import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/types/roles";
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
  Home,
  Calendar,
  CalendarCheck,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  LayoutDashboard,
  Building2,
  Heart,
  Play,
  Store,
  ClipboardCheck,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "On-Demand", href: "/on-demand", icon: Play },
  { name: "Studios", href: "/studios", icon: Building2 },
  { name: "Instructors", href: "/instructors", icon: Heart },
  { name: "My Schedule", href: "/my-schedule", icon: CalendarCheck },
  { name: "Community", href: "/community", icon: Users },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, permissions, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = profile
    ? {
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        avatar: profile.avatar_url || "",
      }
    : {
        name: "Guest",
        email: "",
        avatar: "",
      };

  const showManageLink = hasPermission(permissions, "studio.manage_settings");
  const showStaffLink = hasPermission(permissions, "studio.checkin");
  const showAdminLink = hasPermission(permissions, "platform.admin");

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          {/* Studio Brand */}
          <Link to="/home" className="flex items-center gap-2.5 mr-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-teal to-accent-sage shadow-md">
              <span className="text-lg font-bold text-white">O</span>
            </div>
            <span className="text-xl font-display font-bold tracking-tight">Oxatl Yoga</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher compact />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-sm">
                3
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-accent-lilac text-foreground font-semibold">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-2xl p-2" align="end">
                <div className="flex items-center gap-3 p-2 mb-2">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-accent-lilac text-foreground font-semibold">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link to="/account" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                {(showManageLink || showStaffLink || showAdminLink) && (
                  <>
                    <DropdownMenuSeparator />
                    {showManageLink && (
                      <DropdownMenuItem asChild className="rounded-xl">
                        <Link to="/manage" className="flex items-center gap-2 cursor-pointer">
                          <Store className="h-4 w-4" />
                          Studio Manager
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {showStaffLink && (
                      <DropdownMenuItem asChild className="rounded-xl">
                        <Link to="/staff/checkin" className="flex items-center gap-2 cursor-pointer">
                          <ClipboardCheck className="h-4 w-4" />
                          Front Desk
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {showAdminLink && (
                      <DropdownMenuItem asChild className="rounded-xl">
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />
                          Platform Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl cursor-pointer text-destructive"
                  onClick={async () => {
                    await signOut();
                    navigate("/auth/login");
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card animate-fade-in">
            <nav className="container py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-8 md:py-10">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-6 mt-auto">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Oxatl Yoga. All rights reserved.</span>
          <span>
            Powered by{" "}
            <Link to="/" className="text-accent-teal hover:text-accent-teal/80 font-medium transition-colors">
              Tandava
            </Link>
            {" "}&mdash; Open Source Studio Management
          </span>
        </div>
      </footer>
    </div>
  );
}
