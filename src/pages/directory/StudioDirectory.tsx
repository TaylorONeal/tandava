/**
 * Studio directory index: /studios (also /directory).
 *
 * A factual, positive directory of yoga studios built from public map data
 * (PRD-028). Filters: country, state, city, style, studio software. Archived
 * (closed) studios stay listed but are hidden from search unless the visitor
 * asks for them.
 */

import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { Input } from "@/components/ui/input";
import { Band, Eyebrow } from "@/components/marketing/brand";
import studiosData from "@/data/directory/studios.public.json";
import meta from "@/data/directory/meta.json";
import display from "@/data/directory/display.json";
import {
  type DirectoryFilters,
  type DirectoryStudio,
  facets,
  filterStudios,
  formatRefreshed,
  placeLine,
  softwareLine,
  STATUS_LABEL,
  styleFacet,
  styleLabel,
  updateMailto,
} from "@/lib/directory";
import { DirectoryNotice } from "./DirectoryNotice";

const STUDIOS = studiosData as DirectoryStudio[];
const PAGE = 60;
const KEYS = ["q", "country", "region", "city", "style", "software", "show"] as const;
const INDEXABLE = import.meta.env.VITE_DIRECTORY_INDEXABLE === "true";

export default function StudioDirectory() {
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(PAGE);
  const f: DirectoryFilters = useMemo(() => {
    const out: DirectoryFilters = {};
    for (const k of KEYS) {
      const v = params.get(k);
      if (v) (out as Record<string, string>)[k] = v;
    }
    return out;
  }, [params]);

  const set = (k: (typeof KEYS)[number], v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    // A narrower place resets the narrower filters beneath it.
    if (k === "country") { next.delete("region"); next.delete("city"); }
    if (k === "region") next.delete("city");
    setParams(next, { replace: true });
    setLimit(PAGE);
  };

  const rows = useMemo(() => filterStudios(STUDIOS, f), [f]);
  const opts = useMemo(() => facets(STUDIOS, f), [f]);
  const archivedCount = useMemo(() => filterStudios(STUDIOS, { ...f, show: "archived" }).length, [f]);
  const anyFilter = KEYS.some((k) => k !== "show" && f[k]);

  const where = f.city ?? (f.region ? opts.region.find((o) => o.value === f.region)?.label : undefined) ?? (f.country ? opts.country.find((o) => o.value === f.country)?.label : undefined);
  const title = where ? `Yoga studios in ${where}` : "Yoga studio directory";

  return (
    <MarketingShell>
      <div className="mkt-grid">
        <div className="max-w-6xl mx-auto px-6 pb-12 pt-12 sm:pt-16">
          <SEOHead
            title={title}
            description={`A directory of ${meta.active} yoga studios${where ? ` in ${where}` : ""}, with links to their own websites, styles and the booking software they use.`}
            canonical="/studios"
            noindex={!INDEXABLE}
          />

          <section className="mb-8">
            <Eyebrow>Studio directory</Eyebrow>
            <h1 className="mt-4 font-brand text-[2.5rem] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[3.6rem]">
              Find a <Band>yoga studio.</Band>
            </h1>
            <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ink/75">
              {meta.active} studios from public map data, each linking to the studio's own site. Book on their page, not ours.
            </p>
          </section>

          <DirectoryNotice email={display.update_email} />

          <div className="mb-6 mt-8 space-y-3" role="search">
            <div className="relative max-w-md">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={f.q ?? ""}
                onChange={(e) => set("q", e.target.value)}
                placeholder="Search studio, neighborhood, style"
                aria-label="Search studios"
                className="ps-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Facet label="Country" value={f.country} options={opts.country} onChange={(v) => set("country", v)} />
              <Facet label="State or region" value={f.region} options={opts.region} onChange={(v) => set("region", v)} />
              <Facet label="City" value={f.city} options={opts.city} onChange={(v) => set("city", v)} />
              <Facet label="Style" value={f.style} options={opts.style} onChange={(v) => set("style", v)} />
              <Facet label="Studio software" value={f.software} options={opts.software} onChange={(v) => set("software", v)} />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="font-semibold">{rows.length} {rows.length === 1 ? "studio" : "studios"}</span>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-ink"
                  checked={f.show === "archived" || f.show === "all"}
                  onChange={(e) => set("show", e.target.checked ? "all" : "")}
                />
                Include closed studios{archivedCount ? ` (${archivedCount})` : ""}
              </label>
              {anyFilter && (
                <button type="button" className="underline underline-offset-4" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="border-y border-ink/15 py-10">
              <p className="font-semibold">No studios match these filters.</p>
              <p className="mt-1 text-ink/70">
                Try a wider area, or{" "}
                <a className="underline underline-offset-4" href={updateMailto(display.update_email, undefined, "add")}>tell us about a studio we're missing</a>.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10 border-y border-ink/15">
              {rows.slice(0, limit).map((s) => (
                <StudioRow key={s.slug} s={s} />
              ))}
            </ul>
          )}
          {rows.length > limit && (
            <button type="button" onClick={() => setLimit((n) => n + PAGE)} className="mt-6 inline-flex h-10 items-center rounded-full border-2 border-ink px-5 text-sm font-semibold">
              Show more ({rows.length - limit} left)
            </button>
          )}

          <p className="mt-10 text-xs text-ink/60">
            Directory data refreshed {formatRefreshed(meta.generated_on)}. {meta.attribution}{" "}
            <Link to="/studios/about" className="underline underline-offset-4">About this directory</Link>
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}

function StudioRow({ s }: { s: DirectoryStudio }) {
  const tags = [...new Set(s.styles.map((id) => styleFacet(id)?.id).filter(Boolean) as string[])].slice(0, 4);
  const sw = softwareLine(s);
  return (
    <li>
      <Link
        to={`/studios/${s.slug}`}
        className="group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <span className="min-w-0">
          <span className="block font-semibold leading-tight group-hover:underline group-hover:underline-offset-4">{s.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/70">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {placeLine(s)}
            </span>
            {!s.is_active && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold">{STATUS_LABEL[s.status]}</span>}
            {s.status === "temporarily_closed" && <span className="rounded-full bg-lime px-2 py-0.5 text-xs font-semibold">Temporarily closed</span>}
          </span>
          {(tags.length > 0 || sw) && (
            <span className="mt-1.5 block text-xs text-ink/60">
              {tags.map(styleLabel).join(" · ")}
              {tags.length > 0 && sw ? " · " : ""}
              {sw}
            </span>
          )}
        </span>
        <ArrowUpRight className="mt-1 hidden h-4 w-4 sm:block" aria-hidden />
      </Link>
    </li>
  );
}

function Facet({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: { value: string; label: string; count: number }[];
  onChange: (v: string) => void;
}) {
  const id = `facet-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-ink/60">
      {label}
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block h-10 w-full rounded-md border-2 border-ink/25 bg-white px-2 text-sm font-normal normal-case tracking-normal text-ink focus:border-ink focus:outline-none"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label} ({o.count})
          </option>
        ))}
      </select>
    </label>
  );
}
