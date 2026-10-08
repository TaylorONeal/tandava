/**
 * Return-to-intent for sign in / sign up.
 *
 * A visitor who taps "Book" on a class and is not signed in has to detour
 * through /auth/register or /auth/login (and sometimes Google or an email
 * confirmation link in another tab). Before this module the detour ended on
 * "/" and the class was forgotten. Now the destination travels two ways:
 *
 *   1. `?next=/s/oxatl?class=123` on the auth pages (direct, visible), and
 *   2. a short-lived copy in localStorage, which survives the OAuth redirect
 *      and a confirmation email opened in a new tab.
 *
 * Only same-site relative paths are accepted (no open redirects).
 */

const KEY = "tandava.authReturn";
const TTL_MS = 60 * 60 * 1000; // an hour is plenty for "confirm email, then continue"

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // blocked storage (private mode, embedded frames)
  }
}

function hasControlChars(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0x1f || c === 0x7f) return true;
  }
  return false;
}

/** A same-site path, or null. Never returns an absolute or protocol-relative URL. */
export function safeNext(raw: string | null | undefined, fallback: string | null = null): string | null {
  if (!raw || typeof raw !== "string" || raw.length > 1024) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  // Control characters / whitespace tricks (e.g. "/\t/evil.com").
  if (hasControlChars(raw) || /^\/\s/.test(raw)) return fallback;
  // Do not bounce between auth screens.
  if (raw === "/auth" || raw.startsWith("/auth/")) return fallback;
  return raw;
}

/** `/auth/register?next=%2Fs%2Foxatl%3Fclass%3D1` */
export function authHref(base: "/auth/login" | "/auth/register", next: string | null | undefined): string {
  const safe = safeNext(next);
  return safe ? `${base}?next=${encodeURIComponent(safe)}` : base;
}

export function stashReturn(path: string | null | undefined, storage: StorageLike | null = defaultStorage(), now = Date.now()): void {
  const safe = safeNext(path);
  if (!safe || !storage) return;
  try {
    storage.setItem(KEY, JSON.stringify({ path: safe, at: now }));
  } catch {
    /* storage full or blocked: the ?next= param still works */
  }
}

/** Read and clear the stashed destination (null if none, expired or invalid). */
export function popReturn(storage: StorageLike | null = defaultStorage(), now = Date.now()): string | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(KEY);
    storage.removeItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { path?: string; at?: number };
    if (typeof parsed.at !== "number" || now - parsed.at > TTL_MS) return null;
    return safeNext(parsed.path);
  } catch {
    return null;
  }
}

/** Where to go after authenticating: explicit ?next=, else the stash, else router state, else fallback. */
export function resolveAfterAuth(opts: {
  next?: string | null;
  from?: { pathname?: string; search?: string } | null;
  fallback?: string;
  storage?: StorageLike | null;
  now?: number;
}): string {
  const storage = opts.storage === undefined ? defaultStorage() : opts.storage;
  const stashed = popReturn(storage, opts.now);
  const fromState = opts.from?.pathname ? `${opts.from.pathname}${opts.from.search ?? ""}` : null;
  return safeNext(opts.next) ?? stashed ?? safeNext(fromState) ?? opts.fallback ?? "/";
}
