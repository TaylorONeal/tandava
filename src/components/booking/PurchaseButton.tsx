/**
 * Buy a membership or class pack from a public studio page.
 * Signed out: sign up first and come back to the studio page. Signed in: Stripe Checkout.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { checkoutClassPack, checkoutMembership } from "@/lib/stripe";
import { authHref } from "@/lib/authReturn";
import { trackFunnel } from "@/lib/funnel";

interface Props {
  kind: "membership" | "class_pack";
  studioId: string;
  studioSlug: string;
  itemId: string;
  label: string;
  variant?: "default" | "outline";
  style?: React.CSSProperties;
}

export function PurchaseButton({ kind, studioId, studioSlug, itemId, label, variant = "default", style }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <Button asChild variant={variant} size="sm" className="mt-3 w-full" style={style}>
        <Link to={authHref("/auth/register", `/s/${studioSlug}`)}>{label}</Link>
      </Button>
    );
  }

  const onClick = async () => {
    setBusy(true);
    trackFunnel("checkout_started", { kind });
    const { error } =
      kind === "membership"
        ? await checkoutMembership(studioId, itemId)
        : await checkoutClassPack(studioId, itemId);
    if (error) {
      setBusy(false);
      toast({ title: "Couldn't start checkout", description: error, variant: "destructive" });
    }
  };

  return (
    <Button variant={variant} size="sm" className="mt-3 w-full" style={style} onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </Button>
  );
}
