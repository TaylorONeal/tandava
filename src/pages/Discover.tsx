/**
 * Discover — /discover (and "/" when VITE_HOME_MODE=discover)
 *
 * The student front door: find an upcoming class across discoverable studios
 * and go straight to that studio's storefront to book. No account needed to
 * browse. Data: public discover_classes() RPC (migration 00019).
 *
 * Studio owners and open-source visitors have their own doors (/for-studios,
 * /open-source), linked from the shared header and footer.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Flame, MapPin, Search } from "lucide-react";
import { HelpTip } from "@/components/help/HelpTip";
import { SEOHead } from "@/components/seo/SEOHead";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { Input } from "@/components/ui/input";
import { Band, CtaLink, Eyebrow } from "@/components/marketing/brand";
import { isBackendConfigured } from "@/lib/backend";
import { formatPrice } from "@/lib/reference-data";
import { useDiscoverClasses } from "@/hooks/useDiscover";
import { trackFunnel } from "@/lib/funnel";
import { nativeApp } from "@/lib/native/platform";
import {
  availableStyles,
  classHref,
  filterClasses,
  groupByDay,
  hasEnoughSupply,
  spotsLabel,
} from "@/lib/discover";
import type { DiscoverClassRow } from "@/types/database";

const DEFAULT_CITY = "Austin";

function formatDay(day: string): string {
  // Noon avoids DST edge cases when rendering a bare calendar date.
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(
    new Date(`${day}T12:00:00`),
  );
}

function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(iso));
}

export default function Discover() {
  const [style, setStyle] = useState("");
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, isFetching, refetch } = useDiscoverClasses(DEFAULT_CITY);

  useEffect(() => {
    trackFunnel("discover_viewed");
  }, []);

  const rows = useMemo(() => data ?? [], [data]);
  const styles = useMemo(() => availableStyles(rows), [rows]);
  const visible = useMemo(() => filterClasses(rows, { style, query }), [rows, style, query]);
  const groups = useMemo(() => groupByDay(visible), [visible]);
  const thin = !isLoading && !hasEnoughSupply(rows);

  return (
    <Shell>
      <SEOHead
        title={`Find a yoga class in ${DEFAULT_CITY}`}
        description={`Browse upcoming classes at independent studios in ${DEFAULT_CITY} and find your next class.`}
        canonical="/discover"
      />

      <section className="mb-10">
        <Eyebrow>Independent studios, {DEFAULT_CITY}</Eyebrow>
        <div className="mt-4 flex items-start gap-2">
          <h1 className="font-brand text-[2.5rem] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[3.6rem]">
            Find a class <Band>in {DEFAULT_CITY}.</Band>
          </h1>
          <HelpTip id="discovery-availability" />
        </div>
        <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-ink/75">
          Pick a class and book it on the studio's own page.
          {nativeApp === null && " It all works in your browser, so there's no app to install."}
        </p>
      </section>

      {!isBackendConfigured() ? (
        <Notice
          title="Class discovery is unavailable"
          body="This version cannot connect to class listings. Use your studio’s usual booking page while discovery is unavailable."
        />
      ) : isLoading ? (
        <div role="status" aria-label="Loading classes" className="divide-y divide-ink/10 border-y border-ink/15">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[4.9rem_minmax(0,1fr)] gap-4 py-4">
              <span className="h-4 w-14 animate-pulse rounded bg-ink/10" />
              <span className="space-y-2">
                <span className="block h-4 w-2/5 animate-pulse rounded bg-ink/10" />
                <span className="block h-3 w-3/5 animate-pulse rounded bg-ink/5" />
              </span>
            </div>
          ))}
        </div>
      ) : isError ? (
        <Notice
          title="We couldn't load classes"
          body="Check your connection and try again. We haven't confirmed whether classes are available."
          action={{ label: isFetching ? "Trying again…" : "Try again", onClick: () => { void refetch(); }, disabled: isFetching }}
        />
      ) : (
        <>
          <div className="mb-6 space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => query && trackFunnel("discover_filtered", { kind: "query" })}
                placeholder="Search class, studio, teacher"
                aria-label="Search classes"
                className="ps-9"
              />
            </div>
            {styles.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by style">
                <StyleChip label="All styles" active={style === ""} onClick={() => setStyle("")} />
                {styles.map((s) => (
                  <StyleChip
                    key={s}
                    label={s}
                    active={style.toLowerCase() === s.toLowerCase()}
                    onClick={() => {
                      setStyle(s);
                      trackFunnel("discover_filtered", { kind: "style", value: s });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {thin && rows.length > 0 && (
            <Notice
              tone="soft"
              title="Showing available classes"
              body={`These are the upcoming ${DEFAULT_CITY} classes currently listed on Tandava. For other options, ask your studio for its booking link.`}
            />
          )}

          {groups.length === 0 ? (
            <Notice
              title={rows.length === 0 ? "No studio classes are listed here yet" : "No classes match"}
              body={
                rows.length === 0
                  ? "There are no upcoming public classes to book in Austin right now. Ask your studio for its usual booking link, or check here again later. Signing up does not unlock more listings."
                  : "Try a different style or clear the search."
              }
              action={rows.length === 0
                ? { label: isFetching ? "Checking…" : "Check again", onClick: () => { void refetch(); }, disabled: isFetching }
                : { label: "Clear filters", onClick: () => { setStyle(""); setQuery(""); } }}
            />
          ) : (
            groups.map((g) => (
              <section key={g.day} className="mb-10" aria-labelledby={`day-${g.day}`}>
                <h2 id={`day-${g.day}`} className="border-b-2 border-ink pb-2 font-brand text-xl font-extrabold tracking-tight">
                  {formatDay(g.day)}
                </h2>
                <ul className="divide-y divide-ink/10">
                  {g.classes.map((c) => (
                    <ClassRow key={c.occurrence_id} c={c} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </Shell>
  );
}

function ClassRow({ c }: { c: DiscoverClassRow }) {
  const full = c.spots_left <= 0;
  return (
    <li>
      <Link
        to={classHref(c)}
        onClick={() => trackFunnel("class_opened", { studio: c.studio_slug, occurrence: c.occurrence_id })}
        className="group grid grid-cols-[4.9rem_minmax(0,1fr)_auto] items-start gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <span className="pt-0.5 font-brand-mono text-sm font-semibold tabular-nums">
          {formatTime(c.starts_at, c.studio_timezone)}
          <span className="block text-xs font-normal text-ink/60">{c.duration_minutes} min</span>
        </span>
        <span className="min-w-0">
          <span className="block font-semibold leading-tight group-hover:underline group-hover:underline-offset-4">{c.offering_name}</span>
          <span className="mt-0.5 block text-sm text-ink/70">
            {c.studio_name}
            {c.teacher_name ? `, with ${c.teacher_name}` : ""}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/60">
            {(c.location_name || c.city) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {c.location_name ?? c.city}
              </span>
            )}
            {c.is_heated && (
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" aria-hidden />
                Heated
              </span>
            )}
            {c.drop_in_price_cents != null && <span>Drop-in {formatPrice(c.drop_in_price_cents, c.currency)}</span>}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 font-brand-mono text-[0.7rem] font-semibold ${
              full ? "bg-coral text-ink" : c.spots_left <= 3 ? "bg-lime text-ink" : "bg-ink/5 text-ink/70"
            }`}
          >
            {spotsLabel(c.spots_left)}
          </span>
          <ArrowUpRight className="hidden h-4 w-4 sm:block" aria-hidden />
        </span>
      </Link>
    </li>
  );
}

function StyleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 items-center rounded-full border-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
        active ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}

function Notice({
  title,
  body,
  cta,
  action,
  tone,
}: {
  title: string;
  body: string;
  cta?: { to: string; label: string };
  action?: { label: string; onClick: () => void; disabled?: boolean };
  tone?: "soft";
}) {
  if (tone === "soft") {
    return (
      <div className="mb-8 border-l-4 border-lime bg-white px-5 py-4">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-ink/70">{body}</p>
      </div>
    );
  }
  return (
    <div className="mb-8 grid gap-6 border-y-2 border-ink py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <h2 className="font-brand text-2xl font-extrabold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-[52ch] text-ink/70">{body}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className="justify-self-start rounded-full border-2 border-ink px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-ink hover:text-white disabled:opacity-60"
        >
          {action.label}
        </button>
      )}
      {cta && <CtaLink to={cta.to} variant="secondary">{cta.label}</CtaLink>}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell>
      <div className="mkt-grid">
        <div className="max-w-6xl mx-auto px-6 pb-6 pt-12 sm:pt-16">{children}</div>
      </div>
    </MarketingShell>
  );
}
