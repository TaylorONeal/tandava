import { Card, CardContent } from "@/components/ui/card";
import { HelpTip } from "@/components/help/HelpTip";
import { Compass } from "lucide-react";
import { isBackendConfigured } from "@/lib/backend";
import { useMemberAttribution } from "@/hooks/useAttribution";
import { channelLabel } from "@/lib/analytics/sources";
import { formatPrice } from "@/lib/reference-data";
import type { MemberAttribution, TouchSnapshot } from "@/types/attribution";

const SAMPLE: MemberAttribution = {
  source: "express",
  acquired_at: "2026-08-14T15:02:00Z",
  first_touch: { channel: "organic_social", utm_source: "instagram", utm_campaign: "bio_link", surface: "booking" },
  conversions: [
    { type: "guest_booking", value_cents: 2200, currency: "USD", occurred_at: "2026-08-14T15:02:00Z", first_touch: null, converting_touch: null, days_to_convert: 0 },
    { type: "pack_purchase", value_cents: 12000, currency: "USD", occurred_at: "2026-08-20T18:40:00Z", first_touch: null, converting_touch: { channel: "email" }, days_to_convert: 6 },
  ],
};

const TYPE_LABEL: Record<string, string> = {
  guest_booking: "Booked as a guest",
  member_booking: "Booked",
  membership_start: "Started a membership",
  pack_purchase: "Bought a class pack",
  event_registration: "Registered for an event",
  account_claimed: "Saved their details",
};

function describeTouch(t: TouchSnapshot | null | undefined): string {
  if (!t?.channel) return "Before tracking started";
  const detail = [t.utm_source ?? t.referrer_host, t.utm_campaign].filter(Boolean).join(" · ");
  return detail ? `${channelLabel(t.channel)} (${detail})` : channelLabel(t.channel);
}

/** "How they found you" on the member page (PRD-024 phase 1). Staff only. */
export function MemberSourceStrip({ profileId }: { profileId: string | undefined }) {
  const live = isBackendConfigured();
  const { data, isLoading } = useMemberAttribution(live ? profileId : undefined);
  const a = live ? data : SAMPLE;
  if (live && (isLoading || !a)) return null;
  if (!a) return null;

  const money = a.conversions.reduce((sum, c) => sum + (c.value_cents ?? 0), 0);
  const currency = a.conversions.find((c) => c.currency)?.currency ?? "USD";
  const first = a.conversions[0];

  return (
    <Card>
      <CardContent className="pt-4 pb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Compass className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              How they found you <HelpTip id="attribution" />
            </p>
            <p className="font-medium break-words">{describeTouch(a.first_touch)}</p>
            {first && (
              <p className="text-sm text-muted-foreground">
                {TYPE_LABEL[first.type] ?? first.type}
                {first.days_to_convert !== null && first.days_to_convert > 0
                  ? ` ${first.days_to_convert} days after the first visit`
                  : first.days_to_convert === 0
                    ? " on the first visit"
                    : ""}
              </p>
            )}
          </div>
        </div>
        {a.conversions.length > 0 && (
          <div className="text-sm sm:text-right shrink-0">
            <p className="font-medium">{formatPrice(money, currency)}</p>
            <p className="text-muted-foreground">
              across {a.conversions.length} tracked {a.conversions.length === 1 ? "purchase or booking" : "purchases and bookings"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
