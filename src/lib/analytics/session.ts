/**
 * First-party session capture in the browser (PRD-024 step 1).
 *
 * One random visitor id per browser (localStorage), one session token per
 * studio per 30 minutes of activity (sessionStorage). Storage can be blocked
 * (private mode, embedded iframes): everything falls back to in-memory ids, so
 * capture degrades to "a visit we can't join to the next one", never an error.
 * No cookies, no third parties, no IP stored (the server never receives one
 * from this payload; the Edge Function does not record it).
 */

import { api, data } from "@/lib/backend";
import { classifyChannel } from "./channel";
import { deviceType, parseLanding } from "./landing";

const VISITOR_KEY = "tandava.vid";
const SESSION_PREFIX = "tandava.sess.";
const SESSION_TTL_MS = 30 * 60 * 1000;

let memoryVisitor: string | null = null;
const memorySessions = new Map<string, { token: string; id?: string; last: number }>();

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

/**
 * This browser's visitor id. A validated embed handoff id (`tv`) wins over a
 * stored one: the embed session on the studio's own site and the booking here
 * must be one journey. An older id on this origin stays joined to the person
 * through sign-in linking (profile_visitors).
 */
export function getVisitorId(handoff?: string): string {
  try {
    const stored = window.localStorage.getItem(VISITOR_KEY);
    if (handoff && handoff !== stored) {
      window.localStorage.setItem(VISITOR_KEY, handoff);
      return handoff;
    }
    if (stored) return stored;
    const id = randomId();
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    memoryVisitor = handoff ?? memoryVisitor ?? randomId();
    return memoryVisitor;
  }
}

interface StoredSession {
  token: string;
  id?: string;
  last: number;
  /** Campaign tags + click ids the session started with; a reload with the same tags is the same visit. */
  fp?: string;
}

function readSession(slug: string): StoredSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_PREFIX + slug);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return memorySessions.get(slug) ?? null;
  }
}

function writeSession(slug: string, s: StoredSession) {
  try {
    window.sessionStorage.setItem(SESSION_PREFIX + slug, JSON.stringify(s));
  } catch {
    memorySessions.set(slug, s);
  }
}

/** The server-side analytics_sessions id for this studio's current session, if known. */
export function currentSessionId(slug: string): string | undefined {
  return readSession(slug)?.id;
}

export type Surface = "storefront" | "booking" | "embed" | "landing" | "blog" | "teacher" | "app";

/**
 * Record a page view for a studio. A new visit (no session, or 30 minutes
 * idle, or arriving with campaign tags) starts a new session; otherwise the
 * existing one is refreshed.
 */
export async function trackVisit(slug: string, surface: Surface, opts?: { studioSiteHost?: string | null }) {
  if (typeof window === "undefined" || !slug) return;
  const href = window.location.href;
  const facts = parseLanding(href);
  const visitorId = getVisitorId(facts.handoffVisitorId);
  const now = Date.now();
  const existing = readSession(slug);
  const tagged = Boolean(facts.utm.source || facts.utm.medium || Object.values(facts.clickIds).some(Boolean));
  const fp = tagged ? JSON.stringify([facts.utm, facts.clickIds]) : undefined;
  // New session: none yet, 30 minutes idle, or arriving with DIFFERENT tags
  // (a reload of the same tagged link is the same visit).
  const fresh = !existing || now - existing.last > SESSION_TTL_MS || (tagged && fp !== existing.fp);
  const session: StoredSession = fresh ? { token: randomId(), last: now, fp } : { ...existing!, last: now };
  writeSession(slug, session);

  const referrer = document.referrer || null;
  const channel = classifyChannel({
    utmSource: facts.utm.source,
    utmMedium: facts.utm.medium,
    referrer,
    studioSiteHost: opts?.studioSiteHost,
    ...facts.clickIds,
  });

  try {
    const { data } = await api.invoke<{ sessionId?: string | null }>("analytics-session", {
      slug,
      visitorId,
      sessionToken: session.token,
      surface,
      landingUrl: href.slice(0, 1000),
      referrer: referrer?.slice(0, 1000) ?? null,
      utm: facts.utm,
      clickIds: facts.clickIds,
      channel,
      deviceType: deviceType(navigator.userAgent),
    });
    if (data?.sessionId) writeSession(slug, { ...session, id: data.sessionId });
  } catch {
    // Capture must never break the page.
  }
}

const LINKED_PREFIX = "tandava.linked.";
const linkedInMemory = new Set<string>();

/**
 * After sign-in, join this browser's visitor id to the person once per browser
 * session, so the visits they made before signing in count toward their
 * journey. Safe to call on every auth event.
 */
const OWNER_KEY = "tandava.vid.owner";

/**
 * A browser id belongs to one person. When a different account signs in on
 * this browser (a shared laptop, a front desk), start a fresh visitor id and
 * drop the current sessions, so the next person's visits are not added to
 * the previous person's journey. The server enforces the same rule.
 */
export function claimVisitorFor(userId: string) {
  try {
    const owner = window.localStorage.getItem(OWNER_KEY);
    if (owner && owner !== userId) {
      window.localStorage.setItem(VISITOR_KEY, randomId());
      for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
        const k = window.sessionStorage.key(i);
        if (k?.startsWith(SESSION_PREFIX)) window.sessionStorage.removeItem(k);
      }
    }
    window.localStorage.setItem(OWNER_KEY, userId);
  } catch {
    if (memoryOwner && memoryOwner !== userId) {
      memoryVisitor = randomId();
      memorySessions.clear();
    }
    memoryOwner = userId;
  }
}

let memoryOwner: string | null = null;

export async function linkVisitorOnce(userId: string, via = "sign_in") {
  if (typeof window === "undefined" || !userId) return;
  claimVisitorFor(userId);
  const key = LINKED_PREFIX + userId;
  let done = false;
  try {
    done = Boolean(window.sessionStorage.getItem(key));
  } catch {
    done = linkedInMemory.has(key);
  }
  if (!done) {
    try {
      const { error } = await data.linkMyVisitor(getVisitorId(), via);
      // Mark only on success, so a failed link is retried on the next auth event.
      if (!error) {
        try {
          window.sessionStorage.setItem(key, "1");
        } catch {
          linkedInMemory.add(key);
        }
      }
    } catch {
      // Retried on the next auth event.
    }
  }
  try {
    // Email sign-ups: metadata (idempotent server side). OAuth sign-ups are
    // applied by the callback (applyOAuthSignupConsent), which can prove which
    // attempt it was; a bound choice whose save failed is retried here.
    if (!done) await data.applyMySignupConsent();
    await applyOAuthSignupConsent(userId);
  } catch {
    // Best effort; the person can still opt in later.
  }
}

const PENDING_CONSENT_KEY = "tandava.pendingConsent";
const PENDING_TTL_MS = 60 * 60 * 1000;

export interface PendingConsent {
  slug: string;
  granted: boolean;
  /** When the Google sign-up started. */
  startedAt: string;
}

/**
 * Keep the sign-up marketing choice in this browser across an OAuth redirect
 * (Google sign-up carries no metadata). Returns a random nonce that rides on
 * that attempt's callback URL; the callback applies the choice only when the
 * nonce matches, so a cancelled attempt can't opt in whoever signs in next.
 * Expires in an hour.
 */
export function rememberSignupConsent(slug: string | undefined, granted: boolean): string | undefined {
  if (!slug) return undefined;
  const nonce = randomId();
  try {
    const p: StoredPending = { slug, granted, at: Date.now(), nonce };
    window.localStorage.setItem(PENDING_CONSENT_KEY, JSON.stringify(p));
    return nonce;
  } catch {
    return undefined; // Storage blocked: the choice can still be made later.
  }
}

export function clearSignupConsent() {
  try {
    window.localStorage.removeItem(PENDING_CONSENT_KEY);
  } catch {
    // nothing to clear
  }
}

interface StoredPending {
  slug: string;
  granted: boolean;
  at: number;
  nonce: string;
  /** Set by the callback once the nonce matched: the account this choice belongs to. */
  verifiedFor?: string;
}

function readPending(): StoredPending | null {
  try {
    const raw = window.localStorage.getItem(PENDING_CONSENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<StoredPending>;
    if (typeof v.slug !== "string" || typeof v.granted !== "boolean" || typeof v.at !== "number" || typeof v.nonce !== "string")
      return null;
    return v as StoredPending;
  } catch {
    return null;
  }
}

function writePending(p: StoredPending) {
  try {
    window.localStorage.setItem(PENDING_CONSENT_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

/**
 * The pending choice for this account, if it belongs to it: either the OAuth
 * callback proves the attempt (nonce match within the hour) and binds it to
 * the signed-in account, or it was already bound to this account by an
 * earlier callback whose save failed (kept for a week so it can be retried).
 * Not removed here; removed only after the save succeeds.
 */
export function pendingSignupConsentFor(userId: string, nonce?: string | null): PendingConsent | null {
  const p = readPending();
  if (!p || !userId) return null;
  const age = Date.now() - p.at;
  if (p.verifiedFor) {
    if (p.verifiedFor !== userId || age > 7 * 24 * 3600_000) return null;
  } else {
    if (!nonce || p.nonce !== nonce || age > PENDING_TTL_MS) return null;
    writePending({ ...p, verifiedFor: userId });
  }
  return { slug: p.slug, granted: p.granted, startedAt: new Date(p.at).toISOString() };
}

/**
 * Save a pending OAuth sign-up choice for this account. Called by
 * /auth/callback (with the attempt's nonce) and on every later sign-in
 * (retries a bound choice whose save failed). Cleared only on success.
 */
export async function applyOAuthSignupConsent(userId: string, nonce?: string | null) {
  const pending = pendingSignupConsentFor(userId, nonce);
  if (!pending) return;
  try {
    const { error } = await data.applyMySignupConsent(pending);
    if (!error) clearSignupConsent();
  } catch {
    // Kept for the next sign-in.
  }
}

/**
 * On sign-out, give this browser a fresh anonymous identity and drop its
 * sessions, so browsing after sign-out is not added to the signed-out
 * person's journey (and the next person starts clean).
 */
export function forgetVisitor() {
  try {
    window.localStorage.setItem(VISITOR_KEY, randomId());
    window.localStorage.removeItem(OWNER_KEY);
    window.localStorage.removeItem(PENDING_CONSENT_KEY);
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const k = window.sessionStorage.key(i);
      if (k?.startsWith(SESSION_PREFIX) || k?.startsWith(LINKED_PREFIX)) window.sessionStorage.removeItem(k);
    }
  } catch {
    memoryVisitor = randomId();
    memoryOwner = null;
    memorySessions.clear();
    linkedInMemory.clear();
  }
}
