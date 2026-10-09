/**
 * Where to send someone after they sign in, register or set a password.
 *
 * Only same-origin paths are allowed. Anything else (an absolute URL, a
 * protocol-relative `//evil.example`, a backslash trick, a non-path) falls back,
 * so a crafted `?next=` can never turn sign-in into an open redirect.
 */
export function safeNextPath(raw: unknown, fallback = "/"): string {
  if (typeof raw !== "string") return fallback;
  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if ([...value].some((ch) => ch.charCodeAt(0) < 0x20)) return fallback;
  if (value.startsWith("/auth/")) return fallback; // never loop back into auth
  return value;
}

/** `/auth/login?next=<path>` with the path encoded, or plain login for "/". */
export function loginHref(next: string): string {
  const path = safeNextPath(next);
  return path === "/" ? "/auth/login" : `/auth/login?next=${encodeURIComponent(path)}`;
}

/** Path for one class's express booking page. */
export function expressBookingPath(slug: string, occurrenceId: string): string {
  return `/s/${encodeURIComponent(slug)}/book/${encodeURIComponent(occurrenceId)}`;
}

/** The studio slug when a path is on a studio page (/s/<slug>/...), else undefined. */
export function studioSlugFromPath(path: string | null | undefined): string | undefined {
  const m = /^\/s\/([a-z0-9][a-z0-9-]{0,62})(?:[/?#]|$)/i.exec(path ?? "");
  return m ? m[1].toLowerCase() : undefined;
}
