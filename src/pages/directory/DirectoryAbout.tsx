/**
 * /studios/about: how the studio directory works, where the data comes from,
 * the accuracy disclaimer, how to update or remove a listing, and what our
 * site checker reads. Wording source: docs/directory/LEGAL-COPY.md.
 *
 * SCRAPING-PLAN.md requires this page to be live before the site checker
 * fetches any studio website.
 */

import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { Band, Eyebrow } from "@/components/marketing/brand";
import meta from "@/data/directory/meta.json";
import display from "@/data/directory/display.json";
import { formatRefreshed, updateMailto } from "@/lib/directory";

const INDEXABLE = import.meta.env.VITE_DIRECTORY_INDEXABLE === "true";
const CRAWLER = "TandavaStudioDirectory/1.0 (+https://tandavastudio.com/studios/about)";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-ink/10 py-8">
      <h2 className="font-brand text-2xl font-extrabold tracking-[-0.02em]">{title}</h2>
      <div className="mt-3 max-w-[68ch] space-y-3 leading-relaxed text-ink/80">{children}</div>
    </section>
  );
}

export default function DirectoryAbout() {
  const email = display.update_email;
  return (
    <MarketingShell>
      <div className="mkt-grid">
        <div className="max-w-4xl mx-auto px-6 pb-16 pt-12 sm:pt-16">
          <SEOHead
            title="How the studio directory works"
            description="Where the Tandava yoga studio directory gets its listings, how accurate they are, and how a studio can update or remove its listing."
            canonical="/studios/about"
            noindex={!INDEXABLE}
          />

          <section className="mb-4">
            <Eyebrow>Studio directory</Eyebrow>
            <h1 className="mt-4 font-brand text-[2.25rem] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[3rem]">
              How the <Band>directory works.</Band>
            </h1>
            <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ink/75">
              A free, public search directory of yoga studios. It helps people find a studio and then sends them to the
              studio's own website to book.
            </p>
          </section>

          <Section title="What this is">
            <p>
              The directory lists yoga and movement studios with basic public business facts: name, neighborhood and city,
              website and social links, the styles they teach, and the booking software their public booking pages use.
              It is a directory, not a review site. We do not publish ratings, reviews, prices or rankings.
            </p>
            <p>
              Listing a studio is not an endorsement, and a listing does not mean the studio works with us. Tandava is not
              affiliated with the studios listed or with the software companies named. Product and company names belong to
              their owners and are used only to describe what a studio uses.
            </p>
            <p>
              Tandava also makes studio software. Studios that use Tandava get no special placement, and the order of
              results never depends on which software a studio uses.
            </p>
          </Section>

          <Section title="Where listings come from">
            <p>
              Most listings start from{" "}
              <a className="underline underline-offset-4" href="https://www.openstreetmap.org/about" rel="noopener noreferrer" target="_blank">
                OpenStreetMap
              </a>
              , a public map that anyone can edit. Map data is © OpenStreetMap contributors and available under the{" "}
              <a className="underline underline-offset-4" href="https://opendatacommons.org/licenses/odbl/" rel="noopener noreferrer" target="_blank">
                Open Database License
              </a>
              . Corrections that studios send us are added on top.
            </p>
            <p>
              Studio descriptions are written by us from those facts. We do not copy text or photos from studio websites.
              Software is shown when a studio's public booking link points to a known booking platform, so it reflects what
              we saw on a given day, not a statement from the studio or the software company.
            </p>
            <p>
              Studios that appear to have closed stay in the directory as archived listings, so the history is not lost.
              Archived listings are hidden from search results unless you choose to include closed studios.
            </p>
          </Section>

          <Section title="Accuracy">
            <p>
              Listings are provided as is and are not guaranteed to be accurate, complete or current. Studios move, change
              schedules, switch software and close. Every listing shows the date it was last refreshed. Please check details
              with the studio before you visit or pay for anything.
            </p>
            <p>
              The whole directory was last refreshed on {formatRefreshed(meta.generated_on)}.
            </p>
          </Section>

          <Section title="Update or remove a listing">
            <p>
              If you run a studio, you can ask us to correct your listing, add details, mark it closed, or remove it. Email{" "}
              <a className="font-semibold underline underline-offset-4" href={updateMailto(email, undefined, "update")}>
                {email}
              </a>{" "}
              with the studio's name and city and what should change. Every listing page has a button that fills this in for
              you. We aim to act on requests within a few business days.
            </p>
            <p>
              Fixes to the underlying map are welcome too: each listing links to its place on OpenStreetMap, where anyone can
              correct it, and our next refresh picks the change up.
            </p>
          </Section>

          <Section title="Our site checker">
            <p>
              To keep software and links current, an automated checker may visit a studio's own homepage and public booking
              page about once a month. It identifies itself as <code className="rounded bg-ink/5 px-1">{CRAWLER}</code>, follows
              robots.txt, reads only public pages, never signs in, books or submits forms, and waits between requests.
            </p>
            <p>
              To opt out, block that user agent in robots.txt or email us and we will stop checking your site.
            </p>
          </Section>

          <p className="mt-8 text-sm text-ink/60">
            <Link className="underline underline-offset-4" to="/studios">Back to the directory</Link>
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}
