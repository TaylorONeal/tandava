import { Link } from "react-router-dom";
import { updateMailto } from "@/lib/directory";

/** The directory disclaimer shown on every directory page. Wording: docs/directory/LEGAL-COPY.md */
export function DirectoryNotice({ email, compact = false }: { email: string; compact?: boolean }) {
  return (
    <aside aria-label="About this directory" className="border-l-4 border-ink/30 bg-white px-5 py-4 text-sm leading-relaxed text-ink/75">
      <p>
        <strong className="text-ink">This is a public directory, not an endorsement.</strong> Listings come from publicly
        available sources, mainly OpenStreetMap, and are not guaranteed to be accurate or current. Each listing shows when it
        was last refreshed. Check details with the studio before you go.
        {!compact && " Tandava is not affiliated with the studios listed or with the software companies named."}
      </p>
      <p className="mt-2">
        Run one of these studios, or spotted a mistake?{" "}
        <a className="font-semibold underline underline-offset-4" href={updateMailto(email, undefined, "add")}>{email}</a> updates or removes a
        listing. <Link className="underline underline-offset-4" to="/studios/about">How the directory works</Link>
      </p>
    </aside>
  );
}
