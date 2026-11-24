import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { updateMailto } from "@/lib/directory";

function NoticeBody({ email, compact }: { email: string; compact: boolean }) {
  return (
    <>
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
    </>
  );
}

/**
 * Once the full notice has scrolled above the viewport, a one-line bar stays at the
 * bottom of the screen. "Details" opens the full notice again. Returns false where
 * IntersectionObserver is missing, so the page simply shows the full notice.
 */
export function useScrolledPast(ref: React.RefObject<Element>) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return past;
}

/** The directory disclaimer shown on every directory page. Wording: docs/directory/LEGAL-COPY.md */
export function DirectoryNotice({
  email,
  compact = false,
  collapseOnScroll = false,
}: {
  email: string;
  compact?: boolean;
  collapseOnScroll?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const past = useScrolledPast(ref);
  const [open, setOpen] = useState(false);
  const showBar = collapseOnScroll && past;

  useEffect(() => {
    if (!showBar) setOpen(false);
  }, [showBar]);

  return (
    <>
      <aside
        ref={ref}
        aria-label="About this directory"
        className="border-l-4 border-ink/30 bg-white px-5 py-4 text-sm leading-relaxed text-ink/75"
      >
        <NoticeBody email={email} compact={compact} />
      </aside>
      {showBar && (
        <div
          data-testid="directory-notice-bar"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/15 bg-white/95 text-sm text-ink/75 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur"
        >
          <div className="mx-auto max-w-6xl px-6">
            {open && (
              <div id="directory-notice-full" className="max-h-[50vh] overflow-y-auto border-b border-ink/10 py-3 leading-relaxed">
                <NoticeBody email={email} compact={compact} />
              </div>
            )}
            <div className="flex items-center justify-between gap-3 py-2">
              <p className="truncate">
                <strong className="text-ink">Public directory.</strong> Not guaranteed accurate.
              </p>
              <button
                type="button"
                className="shrink-0 font-semibold underline underline-offset-4"
                aria-expanded={open}
                aria-controls="directory-notice-full"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? "Hide" : "Details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
