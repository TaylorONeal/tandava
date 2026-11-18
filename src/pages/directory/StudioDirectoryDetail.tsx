/**
 * Studio directory detail: /studios/:slug. Public tier only (Shared Core
 * section 5): name, status, place, our own summary, links out, styles, the
 * software line and when the record was last refreshed. No reviews, ratings
 * or rankings, ever (PRD-028 page contract).
 */

import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { MarketingShell } from "@/components/layout/MarketingShell";
import studiosData from "@/data/directory/studios.public.json";
import display from "@/data/directory/display.json";
import {
  type DirectoryStudio,
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
const INDEXABLE = import.meta.env.VITE_DIRECTORY_INDEXABLE === "true";

export default function StudioDirectoryDetail() {
  const { slug } = useParams();
  const s = STUDIOS.find((x) => x.slug === slug);

  return (
    <MarketingShell>
      <div className="mkt-grid">
        <div className="max-w-3xl mx-auto px-6 pb-12 pt-10 sm:pt-14">
          <Link to="/studios" className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All studios
          </Link>
          {!s ? (
            <div className="mt-8">
              <SEOHead title="Studio not found" noindex />
              <h1 className="font-brand text-3xl font-extrabold">We don't list that studio</h1>
              <p className="mt-3 text-ink/70">It may have been removed at the studio's request, or the link is wrong.</p>
            </div>
          ) : (
            <StudioBody s={s} />
          )}
        </div>
      </div>
    </MarketingShell>
  );
}

function StudioBody({ s }: { s: DirectoryStudio }) {
  const archived = !s.is_active;
  const tags = [...new Set(s.styles.map((id) => styleFacet(id)?.id).filter(Boolean) as string[])];
  const detail = s.styles.filter((id) => !tags.includes(id) && styleFacet(id));
  const sw = softwareLine(s);
  const links: { label: string; href: string }[] = [
    s.links.website && { label: "Website", href: s.links.website },
    s.links.booking && { label: "Book a class", href: s.links.booking },
    s.links.instagram && { label: "Instagram", href: `https://www.instagram.com/${s.links.instagram}/` },
    s.links.facebook && { label: "Facebook", href: s.links.facebook },
    s.links.youtube && { label: "YouTube", href: s.links.youtube },
    s.links.tiktok && { label: "TikTok", href: s.links.tiktok },
  ].filter(Boolean) as { label: string; href: string }[];

  const ld = {
    "@context": "https://schema.org",
    "@type": "ExerciseGym",
    name: s.name,
    ...(s.description ? { description: s.description } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: s.address.locality,
      ...(s.address.region_code ? { addressRegion: s.address.region_code } : {}),
      addressCountry: s.address.country_code,
    },
    ...(s.links.website ? { url: s.links.website } : {}),
    ...(links.length ? { sameAs: links.map((l) => l.href) } : {}),
  };

  return (
    <article className="mt-6">
      <SEOHead
        title={`${s.name}, ${s.address.locality}`}
        description={s.description ?? `${s.name} in ${placeLine(s)}.`}
        canonical={`/studios/${s.slug}`}
        ogType="place"
        structuredData={archived ? undefined : ld}
        noindex={!INDEXABLE}
      />
      <h1 className="font-brand text-[2.2rem] font-extrabold leading-[1] tracking-[-0.04em] sm:text-[3rem]">{s.name}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-ink/75">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-4 w-4" aria-hidden />
          {placeLine(s)}
          {s.address.street ? ` · ${s.address.street}` : ""}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${archived ? "bg-ink/10" : "bg-lime"}`}>
          {STATUS_LABEL[s.status]}
          {s.status === "historic" && s.opened_year && s.closed_year ? `, ${s.opened_year} to ${s.closed_year}` : ""}
        </span>
      </p>
      {s.status_note && <p className="mt-2 text-sm text-ink/70">{s.status_note}</p>}
      {s.description && <p className="mt-6 text-lg leading-relaxed">{s.description}</p>}

      {links.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex h-10 items-center gap-1 rounded-full border-2 border-ink px-4 text-sm font-semibold hover:bg-ink hover:text-paper"
            >
              {l.label} <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          ))}
        </div>
      )}

      <dl className="mt-8 grid gap-x-8 gap-y-4 border-y border-ink/15 py-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Styles</dt>
          <dd className="mt-1 text-ink/75">
            {tags.length ? tags.map(styleLabel).join(", ") : "Not listed yet"}
            {detail.length > 0 && <span className="block text-xs text-ink/60">{detail.map(styleLabel).join(", ")}</span>}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Studio software</dt>
          <dd className="mt-1 text-ink/75">{sw ?? "Not detected yet"}</dd>
        </div>
        {display.show_phone && s.phone && (
          <div>
            <dt className="font-semibold">Phone</dt>
            <dd className="mt-1 text-ink/75"><a className="underline underline-offset-4" href={`tel:${s.phone}`}>{s.phone}</a></dd>
          </div>
        )}
        <div>
          <dt className="font-semibold">Last refreshed</dt>
          <dd className="mt-1 text-ink/75">
            {formatRefreshed(s.last_refreshed_at)}
            {s.last_verified_at ? `, checked by a person ${formatRefreshed(s.last_verified_at)}` : ", from map data"}
          </dd>
        </div>
      </dl>

      <p className="mt-6 text-sm">
        Is this your studio, or is something wrong?{" "}
        <a className="font-semibold underline underline-offset-4" href={updateMailto(display.update_email, s, "update")}>Request an update</a>
        {" · "}
        <a className="underline underline-offset-4" href={updateMailto(display.update_email, s, "remove")}>Ask us to remove it</a>
      </p>

      <div className="mt-8">
        <DirectoryNotice email={display.update_email} compact />
      </div>
      {s.map_ref && (
        <p className="mt-4 text-xs text-ink/60">
          Map data (c){" "}
          <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>, ODbL.{" "}
          <a className="underline" href={s.map_ref} target="_blank" rel="noopener noreferrer">See or fix this place on OpenStreetMap</a>.
        </p>
      )}
    </article>
  );
}
