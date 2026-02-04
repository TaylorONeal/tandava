import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsletterSignupProps {
  /** Where this signup appears — used for source tracking */
  source: "footer" | "popup" | "checkout" | "event_page" | "landing_page" | "booking_confirmation";
  /** Compact single-line or expanded card style */
  variant?: "inline" | "card";
  /** Optional class name */
  className?: string;
  /** Custom heading text */
  heading?: string;
  /** Custom description text */
  description?: string;
}

export function NewsletterSignup({
  source,
  variant = "inline",
  className,
  heading = "Stay in the loop",
  description = "Class updates, workshops, and community news. No spam.",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    // In production: call supabase to insert into newsletter_subscribers
    // with source tracking
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
    setEmail("");

    // Reset after showing success
    setTimeout(() => setStatus("idle"), 4000);
  };

  if (variant === "card") {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{heading}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>

        {status === "success" ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-sage/10 text-accent-sage">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">You're subscribed! Check your email to confirm.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "loading"}
              className="flex-1"
            />
            <Button type="submit" disabled={status === "loading"} size="sm">
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>
        )}
      </div>
    );
  }

  // Inline variant — compact single line
  return (
    <div className={cn("", className)}>
      {status === "success" ? (
        <div className="flex items-center gap-2 text-accent-sage text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>Subscribed! Check your email.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="email"
            placeholder="Email for updates"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "loading"}
            className="h-8 text-sm max-w-[200px]"
          />
          <Button type="submit" size="sm" variant="outline" disabled={status === "loading"} className="h-8 text-xs">
            {status === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Subscribe"}
          </Button>
        </form>
      )}
    </div>
  );
}
