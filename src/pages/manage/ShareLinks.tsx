/**
 * Your booking links — /manage/share (PRD-022)
 *
 * The branded storefront (`/s/:slug`) and the one-tap class booking page
 * (`/s/:slug/book/:occurrenceId`, PRD-020) both already worked. Nothing in the
 * product told an owner they existed, there was no way to copy one, and the
 * storefront URL appeared nowhere in `/manage`. So the highest-leverage booking
 * work was not building anything new; it was surfacing a link that already
 * works.
 *
 * Why this ranks above widget polish for this segment: a studio on Squarespace
 * still posts to Instagram every day. A link needs no install, no plan upgrade,
 * and no web person. The widget matters for the studio that already has traffic
 * on its own site; the link matters for everyone.
 *
 * Audience is the studio owner, working alone (docs/positioning/AUDIENCES.md,
 * surface 3). So: no slugs to type, no hex codes to find, no jargon, and the QR
 * code is a real scannable PNG rather than a picture of one.
 */

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMyStudio, usePublicSchedule } from "@/hooks/useBooking";
import { isBackendConfigured } from "@/lib/backend";
import { DEMO_STUDIO } from "@/contexts/DemoContext";
import {
  CHANNEL_PRESETS,
  SHARE_CHANNEL_ORDER,
  buildStorefrontUrl,
  buildClassBookingUrl,
  displayUrl,
  qrFileName,
  type ShareChannel,
} from "@/lib/booking/shareLinks";
import {
  Link2,
  Copy,
  Check,
  QrCode,
  Download,
  ExternalLink,
  AlertTriangle,
  Instagram,
  Calendar,
} from "lucide-react";

// ---------------------------------------------------------------------------
// QR
// ---------------------------------------------------------------------------

/**
 * A real, scannable QR code.
 *
 * `CheckInQRCode` draws a pseudo-random pattern that only looks like a QR code,
 * which `HOSTED_PRODUCT_REVIEW.md` calls out. A QR an owner prints for the front
 * desk has to actually resolve, so this encodes properly via the `qrcode`
 * library. Error-correction level M survives a scuffed printed card; the
 * generated PNG is 1024px so it holds up at poster size.
 */
function useQrDataUrl(value: string, size = 1024): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setDataUrl(null);
      return;
    }
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000ff", light: "#ffffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return dataUrl;
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

function CopyRow({ url, label, onCopied }: { url: string; label: string; onCopied: () => void }) {
  const [copied, setCopied] = useState(false);

  // Reset the tick so the button does not sit in a "done" state forever.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      onCopied();
    } catch {
      // Clipboard is blocked in some embedded and insecure contexts. The input
      // below is selectable, so the link is never unreachable.
      onCopied();
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="font-mono text-xs"
          aria-label={label}
        />
        <Button onClick={copy} className="shrink-0" variant={copied ? "secondary" : "default"}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1.5" aria-hidden="true" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1.5" aria-hidden="true" /> Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ShareLinks() {
  const { toast } = useToast();
  const live = isBackendConfigured();
  const { data: myStudio, isLoading } = useMyStudio();

  const [channel, setChannel] = useState<ShareChannel>("instagram_bio");
  const [campaign, setCampaign] = useState("");

  // Demo mode has no backend; the page is worth showing to an owner evaluating
  // Tandava, so it renders against the demo studio instead of an empty state.
  const studio = live
    ? myStudio
    : {
        studio_id: DEMO_STUDIO.id,
        name: DEMO_STUDIO.name,
        slug: DEMO_STUDIO.slug,
        timezone: DEMO_STUDIO.timezone,
        currency: DEMO_STUDIO.currency,
        discoverable: true,
        brand_primary_color: DEMO_STUDIO.brand_primary_color ?? null,
        brand_secondary_color: DEMO_STUDIO.brand_secondary_color ?? null,
        logo_url: DEMO_STUDIO.logo_url ?? null,
        express_booking_enabled: true,
        staff_role: "owner" as const,
      };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const slug = studio?.slug ?? "";

  const { data: schedule } = usePublicSchedule(slug || undefined);

  const storefrontUrl = useMemo(
    () => (slug ? buildStorefrontUrl({ origin, slug, channel, campaign }) : ""),
    [origin, slug, channel, campaign],
  );

  // The QR always encodes the print-tagged link, whatever the picker says: a
  // printed code is a printed code, and tagging it as Instagram would be wrong.
  const qrUrl = useMemo(
    () => (slug ? buildStorefrontUrl({ origin, slug, channel: "qr_print", campaign }) : ""),
    [origin, slug, campaign],
  );
  const qrDataUrl = useQrDataUrl(qrUrl);

  const upcoming = (schedule ?? []).slice(0, 8);

  const notify = () =>
    toast({ title: "Copied", description: "Paste it wherever you share your classes." });

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = qrFileName(slug);
    a.click();
  };

  if (live && isLoading) {
    return (
      <ManageLayout>
        <div className="max-w-3xl space-y-4">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded bg-muted" />
        </div>
      </ManageLayout>
    );
  }

  if (live && !studio) {
    return (
      <ManageLayout>
        <div className="max-w-3xl">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                We couldn't find a studio for your account. Finish setup in Onboarding and your
                booking links will appear here.
              </p>
            </CardContent>
          </Card>
        </div>
      </ManageLayout>
    );
  }

  return (
    <ManageLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Link2 className="h-6 w-6" /> Your booking links
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One link that takes someone straight to your classes and lets them book without making
            an account. No website needed.
          </p>
        </div>

        {/* Discoverability is the one thing that silently breaks every link on
            this page, so it is stated at the top rather than discovered later. */}
        {studio && !studio.discoverable && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Your page isn't public yet</p>
                <p className="text-muted-foreground">
                  These links won't work for anyone else until your studio is set to discoverable.
                  Turn it on in Settings, then come back.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- The main link ------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your studio page</CardTitle>
            <CardDescription>
              Shows your schedule, prices and teachers, in your branding. This is the link for your
              Instagram bio, Linktree or Google listing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="channel">Where are you putting it?</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as ShareChannel)}>
                  <SelectTrigger id="channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHARE_CHANNEL_ORDER.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CHANNEL_PRESETS[c].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{CHANNEL_PRESETS[channel].hint}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="campaign">Name this push (optional)</Label>
                <Input
                  id="campaign"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="spring challenge"
                />
                <p className="text-xs text-muted-foreground">
                  Lets you tell two pushes apart in your reports later.
                </p>
              </div>
            </div>

            <CopyRow url={storefrontUrl} label="Your link" onCopied={notify} />

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={storefrontUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" /> See what they'll see
                </a>
              </Button>
              <span className="text-xs text-muted-foreground">{displayUrl(storefrontUrl)}</span>
            </div>
          </CardContent>
        </Card>

        {/* --- QR ------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4" /> Printable QR code
            </CardTitle>
            <CardDescription>
              For a card at the front desk, a flyer, or your studio window. Scans straight to your
              schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code linking to ${studio?.name ?? "your"} class schedule`}
                className="h-40 w-40 rounded-lg border border-border bg-white p-2"
              />
            ) : (
              <div className="h-40 w-40 animate-pulse rounded-lg bg-muted" />
            )}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                High resolution, so it stays sharp printed large. Bookings from it show up tagged as
                QR, so you can tell whether the front desk card is earning its space.
              </p>
              <Button onClick={downloadQr} disabled={!qrDataUrl} variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" aria-hidden="true" /> Download PNG
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* --- Per-class links ----------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" /> Links to one class
            </CardTitle>
            <CardDescription>
              Skips the schedule and opens that class, ready to book. Good for a story sticker, or
              replying to someone who asked about tonight.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {live
                  ? "No upcoming classes on your public schedule yet. Once you publish classes, their links show up here."
                  : "Demo mode doesn't load a live schedule. On a real studio, your next classes are listed here with a copy button each."}
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((c) => {
                  const url = buildClassBookingUrl({
                    origin,
                    slug,
                    occurrenceId: c.occurrence_id,
                    channel: channel === "direct" ? "direct" : "instagram_story",
                    campaign,
                  });
                  const when = new Date(c.starts_at).toLocaleString(undefined, {
                    timeZone: c.studio_timezone,
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  const spots = Math.max(0, (c.capacity ?? 0) - (c.booked_count ?? 0));
                  return (
                    <div
                      key={c.occurrence_id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.offering_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {when}
                          {c.teacher_name ? ` · ${c.teacher_name}` : ""}
                          {spots > 0 ? ` · ${spots} left` : " · full"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={async () => {
                          try {
                            await navigator.clipboard?.writeText(url);
                          } catch {
                            /* selectable above; nothing to recover */
                          }
                          notify();
                        }}
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Copy
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Where to put it ----------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Instagram className="h-4 w-4" /> Where to put your link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              {
                where: "Instagram bio",
                how: "Edit profile → Website → paste. Pick \"Instagram bio\" above first so you can see what it brings in.",
              },
              {
                where: "Linktree or TeacherTree",
                how: "Add a new link, paste, and title it something a student would tap: \"Book a class\" beats \"Schedule\".",
              },
              {
                where: "Google Business Profile",
                how: "Edit profile → Bookings (or Website). Often a studio's busiest link, and the easiest one to forget.",
              },
              {
                where: "Instagram story",
                how: "Use a per-class link from above with the link sticker, so the tap lands on the class you're posting about.",
              },
              {
                where: "Your email signature",
                how: "Under your name. Every reply becomes a quiet invitation.",
              },
            ].map((row) => (
              <div key={row.where} className="flex gap-3">
                <Badge variant="secondary" className="h-fit shrink-0">
                  {row.where}
                </Badge>
                <p className="text-muted-foreground">{row.how}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {studio && !studio.express_booking_enabled && live && (
          <Card className="border-border bg-muted/40">
            <CardContent className="py-4 text-sm">
              <p className="font-medium">Want them to book without making an account?</p>
              <p className="mt-1 text-muted-foreground">
                Instant booking is off for your studio, so visitors following these links are asked
                to create an account first. You can turn it on in Settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ManageLayout>
  );
}
