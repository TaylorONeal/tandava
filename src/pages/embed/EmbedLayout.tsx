import { useEffect, useRef, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Chrome-less wrapper for embeddable widget pages (rendered inside the iframe
 * that public/embed.js injects on a studio's website).
 *
 * - Reports its content height to the parent via postMessage so embed.js can
 *   size the iframe (no inner scrollbars).
 * - Applies the studio's brand color from the `?primary=` query param.
 */
export function EmbedLayout({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [params] = useSearchParams();
  const primary = params.get("primary");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const post = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      window.parent?.postMessage({ type: "tandava-embed-height", height }, "*");
    };

    post();
    const ro = new ResizeObserver(post);
    ro.observe(el);
    window.addEventListener("load", post);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", post);
    };
  }, []);

  const style = primary
    ? ({ ["--embed-primary" as string]: `#${primary.replace(/^#/, "")}` } as React.CSSProperties)
    : undefined;

  return (
    <div ref={ref} style={style} className="bg-transparent text-foreground p-3">
      {children}
    </div>
  );
}

/** Open a hosted Tandava page in a new tab (keeps the host site in place). */
export function openHosted(path: string) {
  window.open(`${window.location.origin}${path}`, "_blank", "noopener");
}
