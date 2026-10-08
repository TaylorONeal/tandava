/**
 * Shaping get_attribution_sources() rows for the owner "Where students come
 * from" report (PRD-024 phase 1). Pure so it can be tested without a database.
 */

import type { AttributionSourceRow } from "@/types/attribution";

const CHANNEL_LABELS: Record<string, string> = {
  paid_social: "Paid social",
  organic_social: "Social (unpaid)",
  paid_search: "Paid search",
  organic_search: "Search (unpaid)",
  email: "Email",
  sms: "Text message",
  qr: "QR code or print",
  embed: "Your website",
  network: "Studio Network",
  referral: "Other websites",
  direct: "Direct or unknown",
  unknown: "Before tracking started",
};

/** Plain-words name for a channel key; unknown keys pass through readable. */
export function channelLabel(channel: string): string {
  return CHANNEL_LABELS[channel] ?? channel.replace(/_/g, " ");
}

export interface ChannelSummary {
  channel: string;
  label: string;
  sessions: number;
  newPeople: number;
  bookings: number;
  purchases: number;
  revenueCents: number;
  /** Bookings per 100 visits, or null when there were no visits to divide by. */
  bookingRate: number | null;
  rows: AttributionSourceRow[];
}

export interface SourcesSummary {
  totals: Omit<ChannelSummary, "channel" | "label" | "rows">;
  channels: ChannelSummary[];
}

function rate(bookings: number, sessions: number): number | null {
  if (sessions <= 0) return null;
  return Math.round((bookings / sessions) * 1000) / 10;
}

/**
 * Group rows by channel, keep each channel's source/campaign rows for the
 * drill-down, and sort channels by revenue then bookings then visits.
 */
export function summariseSources(rows: AttributionSourceRow[]): SourcesSummary {
  const byChannel = new Map<string, ChannelSummary>();
  for (const r of rows) {
    const c =
      byChannel.get(r.channel) ??
      {
        channel: r.channel,
        label: channelLabel(r.channel),
        sessions: 0,
        newPeople: 0,
        bookings: 0,
        purchases: 0,
        revenueCents: 0,
        bookingRate: null,
        rows: [],
      };
    c.sessions += r.sessions;
    c.newPeople += r.new_people;
    c.bookings += r.bookings;
    c.purchases += r.purchases;
    c.revenueCents += r.revenue_cents;
    c.rows.push(r);
    byChannel.set(r.channel, c);
  }
  const channels = [...byChannel.values()]
    .map((c) => ({
      ...c,
      bookingRate: rate(c.bookings, c.sessions),
      rows: [...c.rows].sort((a, b) => b.revenue_cents - a.revenue_cents || b.bookings - a.bookings || b.sessions - a.sessions),
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents || b.bookings - a.bookings || b.sessions - a.sessions);

  const totals = channels.reduce(
    (t, c) => ({
      sessions: t.sessions + c.sessions,
      newPeople: t.newPeople + c.newPeople,
      bookings: t.bookings + c.bookings,
      purchases: t.purchases + c.purchases,
      revenueCents: t.revenueCents + c.revenueCents,
      bookingRate: null as number | null,
    }),
    { sessions: 0, newPeople: 0, bookings: 0, purchases: 0, revenueCents: 0, bookingRate: null as number | null },
  );
  totals.bookingRate = rate(totals.bookings, totals.sessions);
  return { totals, channels };
}

/** [from, to) for the last N days ending now. */
export function lastDays(days: number, now: Date = new Date()): { from: Date; to: Date } {
  return { from: new Date(now.getTime() - days * 86_400_000), to: now };
}

/** Plain words for a source/campaign row: "instagram · fall_intro", or a fallback. */
export function sourceLine(r: Pick<AttributionSourceRow, "utm_source" | "utm_campaign">): string {
  const parts = [r.utm_source, r.utm_campaign].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No campaign tags";
}
