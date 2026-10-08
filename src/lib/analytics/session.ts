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
import { deviceType, parseLanding, sanitizeUrl } from "./landing";

const VISITOR_KEY = "tandava.vid";
const SESSION_PREFIX = "tandava.sess.";
const SESSION_TTL_MS = 30 * 60 * 1000;
/** Longest one capture attempt may take before the next retry (or the next capture) goes ahead. */
const CAPTURE_ATTEMPT_TIMEOUT_MS = 8000;

/**
 * Web storage behind an in-memory overlay. A write or remove that throws
 * (quota, privacy mode, storage blocked) lands in the overlay, which outranks
 * storage for that key: a value, or a tombstone (null) for a failed remove.
 * So a failed write never leaves an older stored value (the previous person's
 * id, owner, session or link marker) in charge, and a page that cannot use
 * storage at all still works from memory. A later write that succeeds clears
 * the overlay entry. Every storage access in this file goes through these.
 */
class OverlayStorage {
  private overlay = new Map<string, string | null>();
  constructor(private readonly store: () => Storage) {}

  get(key: string): string | null {
    if (this.overlay.has(key)) return this.overlay.get(key) ?? null;
    try {
      return this.store().getItem(key);
    } catch {
      return null;
    }
  }

  /** True when the value reached real storage (it survives a reload). */
  set(key: string, value: string): boolean {
    try {
      this.store().setItem(key, value);
      this.overlay.delete(key);
      return true;
    } catch {
      this.overlay.set(key, value);
      return false;
    }
  }

  remove(key: string) {
    try {
      this.store().removeItem(key);
      this.overlay.delete(key);
    } catch {
      this.overlay.set(key, null);
    }
  }

  /** Live keys: storage plus overlay values, minus tombstones. */
  keys(): string[] {
    const out = new Set<string>();
    try {
      const st = this.store();
      for (let i = 0; i < st.length; i++) {
        const k = st.key(i);
        if (k) out.add(k);
      }
    } catch {
      // Overlay only.
    }
    for (const [k, v] of this.overlay) {
      if (v === null) out.delete(k);
      else out.add(k);
    }
    return [...out];
  }

  removePrefixed(prefixes: string[]) {
    for (const k of this.keys()) if (prefixes.some((p) => k.startsWith(p))) this.remove(k);
  }
}

const local = new OverlayStorage(() => window.localStorage);
const session = new OverlayStorage(() => window.sessionStorage);
const lsGet = (k: string) => local.get(k);
const lsSet = (k: string, v: string) => local.set(k, v);
const lsRemove = (k: string) => local.remove(k);


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
  const stored = lsGet(VISITOR_KEY);
  if (handoff && handoff !== stored) {
    // Keep the displaced id so sign-in links its earlier visits too.
    if (stored) rememberPreviousVisitor(stored);
    lsSet(VISITOR_KEY, handoff);
    // Someone already signed in gets no new auth event; link it now (a
    // no-op on the server for anonymous visitors). Kept pending (in memory if
    // storage refuses the write) until the link succeeds; trackVisit and
    // captureSettled retry it.
    lsSet(RELINK_KEY, handoff);
    void retryHandoffLink();
    return handoff;
  }
  if (stored) return stored;
  const id = randomId();
  lsSet(VISITOR_KEY, id);
  return id;
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
    const raw = session.get(SESSION_PREFIX + slug);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeSession(slug: string, s: StoredSession) {
  session.set(SESSION_PREFIX + slug, JSON.stringify(s));
}

const PREVIOUS_KEY = "tandava.vid.prev";
const RELINK_KEY = "tandava.vid.relink";

/** Link a pending embed handoff id for a signed-in person; cleared only on success. */
let handoffInFlight: Promise<void> | null = null;

/** Link a pending embed handoff id; bookings wait on this (captureSettled). */
export function retryHandoffLink(): Promise<void> {
  if (handoffInFlight) return handoffInFlight;
  const p = retryHandoffLinkInner().finally(() => {
    if (handoffInFlight === p) handoffInFlight = null;
  });
  handoffInFlight = p;
  return p;
}

async function retryHandoffLinkInner() {
  const id = lsGet(RELINK_KEY);
  if (!id) return;
  try {
    const { error, owned } = await data.linkMyVisitor(id, "embed_handoff");
    // null: not signed in yet, keep it for later. false: the id belongs to
    // someone else (a copied embed link), so stop using it on this browser.
    if (!error && owned !== null) {
      lsRemove(RELINK_KEY);
      if (owned === false) rotateAwayFrom(id);
    }
  } catch {
    // Retried on the next page view.
  }
}

/**
 * This browser holds a visitor id that the server says belongs to another
 * person. Start a fresh id and drop the visits recorded under the old one in
 * this browser session, so this person's visits and bookings are their own.
 */
function rotateAwayFrom(id: string) {
  if (lsGet(VISITOR_KEY) !== id) return;
  lsSet(VISITOR_KEY, randomId());
  clearSessionKeys([SESSION_PREFIX, LINKED_PREFIX]);
  inFlight.clear(); // a pending capture belongs to the previous visitor id
}

function rememberPreviousVisitor(id: string) {
  const prev = previousVisitorIds().filter((x) => x !== id);
  lsSet(PREVIOUS_KEY, JSON.stringify([id, ...prev].slice(0, 3)));
}

/** Visitor ids this browser used before an embed handoff replaced them (newest first). */
export function previousVisitorIds(): string[] {
  try {
    const list = JSON.parse(lsGet(PREVIOUS_KEY) ?? "[]") as unknown;
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
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
const inFlight = new Map<string, Promise<void>>();

/**
 * Wait (briefly) for this page's visit capture to land, so a booking made
 * seconds after arriving is credited to the visit that brought the person.
 * Never blocks a booking for more than `ms`.
 */
export async function captureSettled(slug?: string, ms = 2000): Promise<void> {
  // Also wait for a sign-in link in progress: the server credits a session
  // only once it can see that the browser belongs to the person booking.
  // A capture that already gave up left a session with no server id: try it
  // once more now, inside the same time cap, rather than book without it.
  retryPendingLink();
  // Same for an embed handoff link that already settled with an error: try
  // again now (a no-op when nothing is pending) so its session is owned.
  void retryHandoffLink();
  if (slug && !inFlight.has(slug) && lastCapture.has(slug)) {
    // No server id yet, or no session at all (an account switch in another
    // tab cleared it while this page stayed open): capture again.
    const stored = readSession(slug);
    // Also when the stored session timed out while the page sat open: it
    // must not be sent as the converting touch.
    if (!stored || !stored.id || Date.now() - stored.last > SESSION_TTL_MS) {
      const args = lastCapture.get(slug)!;
      void trackVisit(slug, args.surface, args.opts);
    }
  }
  const pending = [...(slug ? [inFlight.get(slug)].filter(Boolean) : [...inFlight.values()]), ...(linkInFlight ? [linkInFlight] : []), ...(handoffInFlight ? [handoffInFlight] : [])];
  if (!pending.length) return;
  await Promise.race([Promise.allSettled(pending), new Promise<void>((r) => setTimeout(r, ms))]);
}

/** The last capture's arguments per studio, so captureSettled() can redo a failed one. */
const lastCapture = new Map<string, { surface: Surface; opts?: { studioSiteHost?: string | null } }>();

const CAPTURE_RETRY_MS = [300, 800];
/** How long a capture waits for the server to say whose a handoff id is. */
const HANDOFF_WAIT_MS = 3000;

export function trackVisit(slug: string, surface: Surface, opts?: { studioSiteHost?: string | null }): Promise<void> {
  lastCapture.set(slug, { surface, opts });
  // One capture per studio at a time: a second page view waits for the one in
  // flight, so the promise captureSettled() awaits covers both. Otherwise a
  // tagged arrival still in flight could be overtaken by an untagged view and
  // a booking would freeze the untagged touch.
  const prev = inFlight.get(slug);
  const run = prev
    ? prev.catch(() => undefined).then(() => trackVisitInner(slug, surface, opts))
    : trackVisitInner(slug, surface, opts);
  const p = run.finally(() => {
    if (inFlight.get(slug) === p) inFlight.delete(slug);
  });
  inFlight.set(slug, p);
  return p;
}

async function trackVisitInner(slug: string, surface: Surface, opts?: { studioSiteHost?: string | null }) {
  if (typeof window === "undefined" || !slug) return;
  const href = window.location.href;
  const facts = parseLanding(href);
  // This browser's id belongs to someone who signed in before. Until auth
  // says who (if anyone) is signed in now, a visit could be recorded under
  // the previous person's id: wait briefly for that answer.
  if (!identityResolved && lsGet(OWNER_KEY)) {
    await Promise.race([identityKnown, new Promise((r) => setTimeout(r, IDENTITY_WAIT_MS))]);
    if (!identityResolved) {
      // Still unknown: sending now could file this visit under the previous
      // person's id. Capture once auth answers instead (captureSettled also
      // redoes it before a booking).
      void identityKnown.then(() => trackVisit(slug, surface, opts));
      return;
    }
  }
  // Adopt an embed handoff id first, so the link retry below targets it.
  let visitorId = getVisitorId(facts.handoffVisitorId);
  if (lsGet(RELINK_KEY)) {
    // A signed-in person opening a copied handoff link: the server may say
    // the id belongs to someone else. Wait (briefly) for that answer and use
    // whatever id survives, so this visit never lands in the other person's
    // journey. Anonymous visitors get an immediate null and keep the id.
    const settled = await Promise.race([
      retryHandoffLink().then(() => true),
      new Promise<false>((r) => setTimeout(() => r(false), HANDOFF_WAIT_MS)),
    ]);
    // No answer in time: skip this capture rather than risk writing it under
    // someone else's id. captureSettled() redoes it once the link settles.
    if (!settled) return;
    visitorId = getVisitorId();
  } else {
    void retryHandoffLink();
  }
  retryPendingLink();
  const now = Date.now();
  const existing = readSession(slug);
  // Any campaign tag (source, medium, campaign, content, term) or click id
  // marks a tagged arrival.
  const tagged = Object.values(facts.utm).some(Boolean) || Object.values(facts.clickIds).some(Boolean);
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

  const body = {
    slug,
    visitorId,
    sessionToken: session.token,
    surface,
    // Never store tokens or personal data that ride on URLs.
    landingUrl: sanitizeUrl(href),
    referrer: sanitizeUrl(referrer),
    utm: facts.utm,
    clickIds: facts.clickIds,
    channel,
    deviceType: deviceType(navigator.userAgent),
  };
  // record_session is idempotent per session token, so a retry after a
  // transient failure is safe. Errors resolve (not throw), so check both.
  for (let attempt = 0; attempt <= CAPTURE_RETRY_MS.length; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, CAPTURE_RETRY_MS[attempt - 1]));
    // A newer page view replaced this session: its own capture takes over.
    if (readSession(slug)?.token !== session.token) return;
    try {
      // Bounded: captures for a studio run one at a time, so a request that
      // hangs instead of failing would otherwise block every later capture.
      const res = await Promise.race([
        api.invoke<{ sessionId?: string | null }>("analytics-session", body),
        new Promise<null>((r) => setTimeout(() => r(null), CAPTURE_ATTEMPT_TIMEOUT_MS)),
      ]);
      if (!res) continue;
      const { data, error } = res;
      if (!error && data?.sessionId) {
        // Attach the id only if this is still the current session: a slower
        // response from an earlier page must not restore an older campaign.
        if (readSession(slug)?.token === session.token) {
          writeSession(slug, { ...readSession(slug)!, id: data.sessionId });
        }
        return;
      }
    } catch {
      // Capture must never break the page; fall through to the next attempt.
    }
  }
}

const LINKED_PREFIX = "tandava.linked.";
const CONSENT_PREFIX = "tandava.consent.";

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
  const owner = lsGet(OWNER_KEY);
  if (owner && owner !== userId) {
    inFlight.clear(); // a pending capture belongs to the previous visitor id
    lsSet(VISITOR_KEY, randomId());
    lsRemove(PREVIOUS_KEY);
    lsRemove(RELINK_KEY);
    // A new visitor id needs linking again for everyone, A -> B -> A included.
    clearSessionKeys([SESSION_PREFIX, LINKED_PREFIX, CONSENT_PREFIX]);
  }
  lsSet(OWNER_KEY, userId);
  markIdentityResolved();
}

/** Drop sessionStorage keys with these prefixes; a failed remove leaves a tombstone. */
function clearSessionKeys(prefixes: string[]) {
  session.removePrefixed(prefixes);
}

let linkInFlight: Promise<void> | null = null;
/** The signed-in person whose visitor link last ran; a failed link is retried for them. */
let linkUser: string | null = null;

function linkMarked(userId: string): boolean {
  return Boolean(session.get(LINKED_PREFIX + userId));
}

/**
 * Retry a sign-in link that settled with an error. Called from page capture
 * and before a booking, so a failure during sign-in does not leave the rest
 * of the login session unattributed.
 */
export function retryPendingLink(): void {
  if (typeof window === "undefined" || !linkUser || linkInFlight || linkMarked(linkUser)) return;
  void linkVisitorOnce(linkUser, "sign_in_retry");
}

export function linkVisitorOnce(userId: string, via = "sign_in"): Promise<void> {
  linkUser = userId;
  const p = linkVisitorOnceInner(userId, via).finally(() => {
    if (linkInFlight === p) linkInFlight = null;
  });
  linkInFlight = p;
  return p;
}

async function linkVisitorOnceInner(userId: string, via = "sign_in") {
  if (typeof window === "undefined" || !userId) return;
  claimVisitorFor(userId);
  const key = LINKED_PREFIX + userId;
  const done = Boolean(session.get(key));
  if (!done) {
    try {
      const current = getVisitorId();
      let { error, owned } = await data.linkMyVisitor(current, via);
      if (!error && owned === false) {
        // Someone else owns this browser id (a copied embed link): use a fresh
        // one for this person and link that instead.
        rotateAwayFrom(current);
        ({ error, owned } = await data.linkMyVisitor(getVisitorId(), via));
      }
      // Ids an embed handoff displaced belong to the same person on this
      // browser; each is dropped only once its own link succeeded.
      const failed: string[] = [];
      for (const id of previousVisitorIds()) {
        const r = await data.linkMyVisitor(id, `${via}_previous`).catch(() => ({ error: { message: "failed" } }));
        if (r.error) failed.push(id);
      }
      if (failed.length) lsSet(PREVIOUS_KEY, JSON.stringify(failed));
      else lsRemove(PREVIOUS_KEY);
      // Mark only when everything linked, so failures retry on the next auth event.
      if (!error && failed.length === 0) {
        session.set(key, "1");
      }
    } catch {
      // Retried on the next auth event.
    }
  }
  // Email sign-ups: metadata (idempotent server side), with its own marker so
  // a failed save is retried on the next auth event even if linking worked.
  // OAuth sign-ups are applied by the callback (applyOAuthSignupConsent),
  // which can prove which attempt it was; a bound choice whose save failed is
  // retried here.
  const consentKey = CONSENT_PREFIX + userId;
  const consentDone = Boolean(session.get(consentKey));
  if (!consentDone) {
    try {
      const { error } = await data.applyMySignupConsent();
      if (!error) {
        session.set(consentKey, "1");
      }
    } catch {
      // Retried on the next auth event.
    }
  }
  await applyOAuthSignupConsent(userId);
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
  const p: StoredPending = { slug, granted, at: Date.now(), nonce };
  // Must survive the OAuth redirect: a memory-only copy is no use.
  if (lsSet(PENDING_CONSENT_KEY, JSON.stringify(p))) return nonce;
  lsRemove(PENDING_CONSENT_KEY);
  return undefined; // Storage blocked: the choice can still be made later.
}

export function clearSignupConsent() {
  lsRemove(PENDING_CONSENT_KEY);
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
    const raw = lsGet(PENDING_CONSENT_KEY);
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
  lsSet(PENDING_CONSENT_KEY, JSON.stringify(p));
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
let identityResolved = false;
let resolveIdentity: () => void = () => {};
const identityKnown = new Promise<void>((r) => (resolveIdentity = r));
/** Longest a page view waits for auth to say who is signed in. */
const IDENTITY_WAIT_MS = 1500;

function markIdentityResolved() {
  identityResolved = true;
  resolveIdentity();
}

/**
 * Called once auth knows who is signed in on this page load (null: nobody).
 * Rotates an id that belongs to someone else, then releases page views that
 * were waiting on it.
 */
export function resolveVisitorIdentity(userId: string | null) {
  if (userId) claimVisitorFor(userId);
  else forgetVisitorIfOwned();
  markIdentityResolved();
}

/**
 * A load that starts signed out while this browser's id still belongs to a
 * signed-in person (their session expired or was cleared while the tab was
 * closed): rotate, so anonymous visits don't join their journey. A plain
 * anonymous browser (no owner recorded) keeps its id across reloads.
 */
export function forgetVisitorIfOwned() {
  if (lsGet(OWNER_KEY)) forgetVisitor();
}

export function forgetVisitor() {
  linkUser = null;
  inFlight.clear(); // a pending capture belongs to the previous visitor id
  lsSet(VISITOR_KEY, randomId());
  lsRemove(OWNER_KEY);
  lsRemove(PENDING_CONSENT_KEY);
  lsRemove(PREVIOUS_KEY);
  lsRemove(RELINK_KEY);
  clearSessionKeys([SESSION_PREFIX, LINKED_PREFIX, CONSENT_PREFIX]);
  markIdentityResolved();
}

/**
 * What a checkout should carry for attribution: this browser's visitor id and
 * the most recent visit (for the studio when known). The server verifies both
 * belong to the signed-in person before using them.
 */
export function checkoutAttribution(slug?: string): { visitorId?: string; sessionId?: string } {
  if (typeof window === "undefined") return {};
  const visitorId = getVisitorId();
  if (slug) return { visitorId, sessionId: currentSessionId(slug) };
  let latest: StoredSession | null = null;
  for (const k of session.keys()) {
    if (!k.startsWith(SESSION_PREFIX)) continue;
    try {
      const v = JSON.parse(session.get(k) ?? "null") as StoredSession | null;
      if (v?.id && (!latest || v.last > latest.last)) latest = v;
    } catch {
      // Skip a malformed entry.
    }
  }
  return { visitorId, sessionId: latest?.id };
}
