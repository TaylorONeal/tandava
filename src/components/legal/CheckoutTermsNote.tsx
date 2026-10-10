/**
 * One line shown next to anything that starts a payment: what the buyer
 * agrees to and where refunds are explained (LP-9).
 */
import { Link } from "react-router-dom";

export function CheckoutTermsNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      By paying you agree to the{" "}
      <Link to="/terms" className="underline hover:text-foreground">Terms</Link>. Memberships renew until you cancel.
      Refunds follow the studio's policy (
      <Link to="/refunds" className="underline hover:text-foreground">refund policy</Link>).
    </p>
  );
}
