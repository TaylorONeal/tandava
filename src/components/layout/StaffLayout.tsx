import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ClipboardCheck, ListOrdered, ArrowLeft } from "lucide-react";

interface StaffLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Check-in", href: "/staff/checkin", icon: ClipboardCheck },
  { name: "Waitlist", href: "/staff/waitlist", icon: ListOrdered },
];

export function StaffLayout({ children }: StaffLayoutProps) {
  const location = useLocation();

  const isActive = (href: string) => location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar (staff gets a simpler horizontal nav) */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container flex h-14 items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="h-6 w-px bg-border" />

          <h2 className="text-sm font-bold tracking-tight">Front Desk</h2>

          <nav className="flex items-center gap-1 ml-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-all",
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
        </div>
      </header>

      <main className="container py-6">{children}</main>
    </div>
  );
}
