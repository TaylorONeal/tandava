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
  const fresh = !existing || now - existing.last > SESSION_TTL_MS || tagged;
  const session: StoredSession = fresh ? { token: randomId(), last: now } : { ...existing!, last: now };
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
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    if (linkedInMemory.has(key)) return;
    linkedInMemory.add(key);
  }
  try {
    await data.linkMyVisitor(getVisitorId(), via);
  } catch {
    // Linking is best effort.
  }
  try {
    // A no-op unless the sign-up started on a studio page and wasn't applied yet.
    await data.applyMySignupConsent();
  } catch {
    // Best effort; the person can still opt in later.
  }
}
