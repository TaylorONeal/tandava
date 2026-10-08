import { useState } from "react";
import { Link } from "react-router-dom";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { HelpTip } from "@/components/help/HelpTip";
import { ArrowLeft, ChevronDown, ChevronRight, Link2 } from "lucide-react";
import { isBackendConfigured } from "@/lib/backend";
import { useAttributionSources } from "@/hooks/useAttribution";
import { useMyStudio } from "@/hooks/useBooking";
import { sourceLine, summariseSources } from "@/lib/analytics/sources";
import { formatPrice } from "@/lib/reference-data";
import type { AttributionModel, AttributionSourceRow } from "@/types/attribution";

/** Shown only when no backend is configured (demo / local preview). */
const SAMPLE_ROWS: AttributionSourceRow[] = [
  { channel: "organic_social", utm_source: "instagram", utm_campaign: "bio_link", sessions: 412, new_people: 31, bookings: 38, purchases: 14, revenue_cents: 182000 },
  { channel: "organic_social", utm_source: "instagram", utm_campaign: "fall_intro", sessions: 96, new_people: 12, bookings: 15, purchases: 9, revenue_cents: 81000 },
  { channel: "embed", utm_source: "yourstudio.com", utm_campaign: null, sessions: 655, new_people: 22, bookings: 71, purchases: 18, revenue_cents: 143500 },
  { channel: "organic_search", utm_source: null, utm_campaign: null, sessions: 230, new_people: 9, bookings: 11, purchases: 4, revenue_cents: 42000 },
  { channel: "email", utm_source: "newsletter", utm_campaign: "october", sessions: 120, new_people: 0, bookings: 19, purchases: 3, revenue_cents: 27000 },
  { channel: "direct", utm_source: null, utm_campaign: null, sessions: 380, new_people: 6, bookings: 24, purchases: 2, revenue_cents: 9000 },
];

const RANGES = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

function Num({ value }: { value: number }) {
  return <span className="tabular-nums">{value.toLocaleString()}</span>;
}

export default function AttributionSources() {
  const live = isBackendConfigured();
  const [days, setDays] = useState<number>(30);
  const [model, setModel] = useState<AttributionModel>("first");
  const [open, setOpen] = useState<string | null>(null);
  const { data: studio } = useMyStudio();
  const query = useAttributionSources(studio?.studio_id, days, model);
  const rows = live ? (query.data ?? []) : SAMPLE_ROWS;
  const { totals, channels } = summariseSources(rows);
  const currency = studio?.currency ?? "USD";
  const money = (cents: number) => formatPrice(cents, currency);

  return (
    <ManageLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <Link to="/manage/analytics" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Analytics
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Where students come from</h1>
            <HelpTip id="attribution" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Visits, new people, bookings and money, by the link or site that brought them.
          </p>
          {!live && (
            <Badge variant="secondary" className="mt-2">Sample data</Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            value={String(days)}
            onValueChange={(v) => v && setDays(Number(v))}
            aria-label="Date range"
          >
            {RANGES.map((r) => (
              <ToggleGroupItem key={r.days} value={String(r.days)} size="sm">
                Last {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex items-center gap-1">
            <ToggleGroup
              type="single"
              value={model}
              onValueChange={(v) => v && setModel(v as AttributionModel)}
              aria-label="Credit the"
            >
              <ToggleGroupItem value="first" size="sm">First visit</ToggleGroupItem>
              <ToggleGroupItem value="last" size="sm">Last visit</ToggleGroupItem>
            </ToggleGroup>
            <HelpTip id="attribution-model" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Visits", value: <Num value={totals.sessions} /> },
            { label: "New people", value: <Num value={totals.newPeople} /> },
            { label: "Bookings", value: <Num value={totals.bookings} /> },
            { label: "Money in", value: money(totals.revenueCents) },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-semibold mt-1">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">By channel</CardTitle>
            <CardDescription>
              Tap a channel to see each source and campaign.{" "}
              {model === "first"
                ? "Credited to the visit that first brought each person."
                : "Credited to the visit where they booked or bought."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {live && query.isLoading && <p className="px-6 text-sm text-muted-foreground">Loading…</p>}
            {live && query.isError && (
              <p className="px-6 text-sm text-destructive">
                Couldn't load the report. Only owners and admins can see it.
              </p>
            )}
            {live && !query.isLoading && !query.isError && channels.length === 0 && (
              <div className="px-6 py-4 text-sm text-muted-foreground space-y-2">
                <p>No tracked visits in this range yet.</p>
                <p>
                  Visits to your booking page, your embedded schedule and instant-booking links are counted from now
                  on. Tag the links you share so they show up by name.
                </p>
              </div>
            )}
            {channels.length > 0 && (
              <div className="divide-y">
                <div className="hidden sm:grid grid-cols-[1fr_repeat(5,6rem)] gap-2 px-2 pb-2 text-xs text-muted-foreground">
                  <span>Channel</span>
                  <span className="text-right">Visits</span>
                  <span className="text-right">New people</span>
                  <span className="text-right">Bookings</span>
                  <span className="text-right">Booked per 100</span>
                  <span className="text-right">Money in</span>
                </div>
                {channels.map((c) => {
                  const expanded = open === c.channel;
                  return (
                    <div key={c.channel}>
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : c.channel)}
                        aria-expanded={expanded}
                        className="w-full text-left px-4 sm:px-2 py-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-[1fr_repeat(5,6rem)] gap-x-2 gap-y-1 items-center text-sm">
                          <span className="col-span-2 sm:col-span-1 flex items-center gap-1 font-medium">
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {c.label}
                          </span>
                          <span className="sm:text-right text-muted-foreground sm:text-foreground">
                            <span className="sm:hidden">Visits </span><Num value={c.sessions} />
                          </span>
                          <span className="text-right">
                            <span className="sm:hidden text-muted-foreground">New </span><Num value={c.newPeople} />
                          </span>
                          <span className="sm:text-right">
                            <span className="sm:hidden text-muted-foreground">Bookings </span><Num value={c.bookings} />
                          </span>
                          <span className="text-right">
                            <span className="sm:hidden text-muted-foreground">Per 100 </span>
                            {c.bookingRate === null ? "–" : c.bookingRate}
                          </span>
                          <span className="col-span-2 sm:col-span-1 sm:text-right font-medium">{money(c.revenueCents)}</span>
                        </div>
                      </button>
                      {expanded && (
                        <ul className="pb-3 px-4 sm:px-8 space-y-1">
                          {c.rows.map((r, i) => (
                            <li key={`${r.utm_source}-${r.utm_campaign}-${i}`} className="flex flex-wrap justify-between gap-x-4 text-sm">
                              <span className="text-muted-foreground break-all">{sourceLine(r)}</span>
                              <span className="tabular-nums">
                                {r.sessions.toLocaleString()} visits · {r.bookings.toLocaleString()} booked · {money(r.revenue_cents)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-start gap-2">
              <Link2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium flex items-center gap-1">
                  Want your posts to show up by name? <HelpTip id="attribution-tags" />
                </p>
                <p className="text-sm text-muted-foreground">Tag the links you share, especially your Instagram bio link.</p>
              </div>
            </div>
            <Link to="/manage/utm-builder" className="text-sm font-medium text-primary hover:underline shrink-0">
              Open the UTM Builder
            </Link>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          First-party only: no ad pixels, no IP addresses stored. <HelpTip id="tracking-privacy" />
        </p>
      </div>
    </ManageLayout>
  );
}
