import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users, Sparkles, Check } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import {
  resolveEventPrice,
  resolveTierPrice,
  resolveDeposit,
  registrationState,
  sessionsForTier,
  type ResolvedPrice,
  type RegistrationState,
} from "@/lib/events/pricing";

export interface EventSessionLite {
  session_number: number;
  title: string;
  dateLabel?: string;
  timeLabel?: string;
}

export interface EventPricingTierLite {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  memberPriceCents?: number | null;
  /** Session numbers this tier covers (empty = all). */
  includesSessions?: number[];
}

export interface RegistrationSelection {
  tierId?: string;
  sessionNumbers: number[];
  priceCents: number;
  /** Amount charged now (deposit when paymentOption is "deposit", else full price). */
  dueNowCents: number;
  paymentOption: "full" | "deposit";
  isMember: boolean;
  isWaitlist: boolean;
}

interface EventRegistrationPanelProps {
  // Event-level pricing (used when there are no tiers)
  regularCents: number;
  memberCents?: number | null;
  earlyBirdCents?: number | null;
  earlyBirdEndsAt?: string | null;
  currency?: string;

  // Availability
  status?: string;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  capacity: number;
  spotsLeft: number;
  waitlistEnabled?: boolean;

  // Multi-session / partial series
  sessions?: EventSessionLite[];
  tiers?: EventPricingTierLite[];

  /** Optional deposit (cents). When set and below the price, a pay-deposit option appears. */
  depositCents?: number | null;

  /** Whether the viewer is a member of this studio (drives member pricing). */
  isMember?: boolean;
  /** Show the "I'm a member" toggle (for public/demo pages without auth wired). */
  showMemberToggle?: boolean;

  now?: Date;
  onRegister: (selection: RegistrationSelection) => void;
}

const LABEL_BADGE: Record<ResolvedPrice["label"], string | null> = {
  early_bird: "Early bird",
  member: "Member price",
  tier_member: "Member price",
  tier: null,
  regular: null,
};

export function EventRegistrationPanel({
  regularCents,
  memberCents,
  earlyBirdCents,
  earlyBirdEndsAt,
  currency = "USD",
  status,
  registrationOpensAt,
  registrationClosesAt,
  capacity,
  spotsLeft,
  waitlistEnabled,
  sessions = [],
  tiers = [],
  depositCents,
  isMember: isMemberProp = false,
  showMemberToggle = false,
  now,
  onRegister,
}: EventRegistrationPanelProps) {
  const { formatPrice: localeFormatPrice } = useLocale();
  const fmt = (cents: number) => localeFormatPrice(cents, currency);

  const [memberToggle, setMemberToggle] = useState(isMemberProp);
  const isMember = showMemberToggle ? memberToggle : isMemberProp;

  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    tiers.length > 0 ? tiers[0].id : null,
  );
  const selectedTier = tiers.find((t) => t.id === selectedTierId) ?? null;

  // Resolve the price the user actually pays.
  const price: ResolvedPrice = useMemo(() => {
    if (selectedTier) {
      return resolveTierPrice(
        { priceCents: selectedTier.priceCents, memberPriceCents: selectedTier.memberPriceCents },
        isMember,
      );
    }
    return resolveEventPrice({
      regularCents,
      memberCents,
      earlyBirdCents,
      earlyBirdEndsAt,
      isMember,
      now,
    });
  }, [selectedTier, isMember, regularCents, memberCents, earlyBirdCents, earlyBirdEndsAt, now]);

  // Deposit / pay-in-full split.
  const [paymentOption, setPaymentOption] = useState<"full" | "deposit">("full");
  const deposit = resolveDeposit(price.cents, depositCents);
  const depositAvailable = deposit.isDeposit;
  const dueNow = depositAvailable && paymentOption === "deposit" ? deposit.dueNowCents : price.cents;
  const balance = depositAvailable && paymentOption === "deposit" ? deposit.balanceCents : 0;

  const state: RegistrationState = registrationState({
    status,
    registrationOpensAt,
    registrationClosesAt,
    spotsLeft,
    waitlistEnabled,
    now,
  });

  // Sessions covered by the current selection (for the summary + onRegister).
  const coveredSessions = selectedTier
    ? sessionsForTier(sessions, selectedTier.includesSessions)
    : sessions;
  const coveredNumbers = new Set(coveredSessions.map((s) => s.session_number));

  const spotsLow = spotsLeft > 0 && spotsLeft <= 5;
  const filled = capacity > 0 ? Math.round(((capacity - spotsLeft) / capacity) * 100) : 0;

  const ctaConfig: Record<RegistrationState, { label: string; disabled: boolean }> = {
    open: { label: "Register Now", disabled: false },
    waitlist: { label: "Join Waitlist", disabled: false },
    not_open_yet: {
      label: registrationOpensAt
        ? `Opens ${new Date(registrationOpensAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : "Not open yet",
      disabled: true,
    },
    closed: { label: "Registration Closed", disabled: true },
    sold_out: { label: "Sold Out", disabled: true },
  };
  const cta = ctaConfig[state];

  const handleRegister = () => {
    onRegister({
      tierId: selectedTier?.id,
      sessionNumbers: coveredSessions.map((s) => s.session_number),
      priceCents: price.cents,
      dueNowCents: dueNow,
      paymentOption: depositAvailable ? paymentOption : "full",
      isMember,
      isWaitlist: state === "waitlist",
    });
  };

  const labelBadge = LABEL_BADGE[price.label];

  return (
    <Card className="sticky top-24">
      <CardContent className="p-5 space-y-4">
        <h3 className="font-semibold">Register</h3>

        {/* Member toggle (demo/public pages without auth wired) */}
        {showMemberToggle && (memberCents != null || tiers.some((t) => t.memberPriceCents != null)) && (
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
            <Label htmlFor="member-toggle" className="text-sm">I'm a member</Label>
            <Switch id="member-toggle" checked={memberToggle} onCheckedChange={setMemberToggle} />
          </div>
        )}

        {/* Pricing tiers (partial-series options) */}
        {tiers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Options</p>
            <RadioGroup value={selectedTierId ?? undefined} onValueChange={setSelectedTierId} className="space-y-2">
              {tiers.map((tier) => {
                const tierPrice = resolveTierPrice(
                  { priceCents: tier.priceCents, memberPriceCents: tier.memberPriceCents },
                  isMember,
                );
                const included = sessionsForTier(sessions, tier.includesSessions);
                const partial = sessions.length > 0 && included.length < sessions.length;
                return (
                  <Label
                    key={tier.id}
                    htmlFor={`tier-${tier.id}`}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      selectedTierId === tier.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem value={tier.id} id={`tier-${tier.id}`} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{tier.name}</span>
                        <span className="text-sm font-semibold">{fmt(tierPrice.cents)}</span>
                      </div>
                      {tier.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>
                      )}
                      {partial && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Includes {included.length} of {sessions.length} sessions
                        </p>
                      )}
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>
        )}

        {/* Session list (multi-session events) */}
        {sessions.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Schedule ({sessions.length} sessions)
            </p>
            {sessions.map((s) => {
              const included = coveredNumbers.has(s.session_number);
              return (
                <div
                  key={s.session_number}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
                    included ? "bg-secondary/40" : "opacity-40"
                  }`}
                >
                  <Check className={`h-3.5 w-3.5 shrink-0 ${included ? "text-accent-sage" : "text-transparent"}`} />
                  <span className="flex-1 truncate">{s.title}</span>
                  {(s.dateLabel || s.timeLabel) && (
                    <span className="text-xs text-muted-foreground">
                      {[s.dateLabel, s.timeLabel].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Separator />

        {/* Applied price */}
        <div className="flex items-end justify-between">
          <div>
            {labelBadge && (
              <Badge variant="class" className="mb-1 gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                {labelBadge}
              </Badge>
            )}
            {price.savingsCents > 0 && (
              <p className="text-xs text-muted-foreground line-through">{fmt(price.regularCents)}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{fmt(price.cents)}</span>
            {price.savingsCents > 0 && (
              <p className="text-xs text-accent-sage">Save {fmt(price.savingsCents)}</p>
            )}
          </div>
        </div>

        {/* Deposit / pay-in-full option */}
        {depositAvailable && (
          <RadioGroup
            value={paymentOption}
            onValueChange={(v) => setPaymentOption(v as "full" | "deposit")}
            className="space-y-2"
          >
            <Label htmlFor="pay-full" className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 cursor-pointer ${paymentOption === "full" ? "border-primary bg-primary/5" : "border-border"}`}>
              <span className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="full" id="pay-full" />
                Pay in full
              </span>
              <span className="text-sm font-medium">{fmt(price.cents)}</span>
            </Label>
            <Label htmlFor="pay-deposit" className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 cursor-pointer ${paymentOption === "deposit" ? "border-primary bg-primary/5" : "border-border"}`}>
              <span className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="deposit" id="pay-deposit" />
                Pay deposit
              </span>
              <span className="text-right text-sm">
                <span className="font-medium">{fmt(deposit.dueNowCents)}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {fmt(deposit.balanceCents)} due later
                </span>
              </span>
            </Label>
          </RadioGroup>
        )}

        {balance > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            You'll pay {fmt(dueNow)} now and {fmt(balance)} later.
          </p>
        )}

        {/* Spots */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              Spots remaining
            </span>
            <span className={`font-semibold ${spotsLow ? "text-accent-coral" : ""}`}>
              {Math.max(0, spotsLeft)} of {capacity}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${spotsLow ? "bg-accent-coral" : "bg-primary"}`}
              style={{ width: `${filled}%` }}
            />
          </div>
        </div>

        <Button className="w-full" size="lg" disabled={cta.disabled} onClick={handleRegister}>
          {cta.label}
        </Button>

        {state === "waitlist" && (
          <p className="text-xs text-center text-muted-foreground">
            This event is full — join the waitlist and we'll notify you if a spot opens.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
