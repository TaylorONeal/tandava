/**
 * Signed one-click unsubscribe tokens for automation email (PRD-027).
 *
 * token = base64url("<studioId>:<profileId>") + "." + base64url(HMAC-SHA256)
 *
 * No expiry: an unsubscribe link has to keep working in an old email. The
 * token only lets its holder turn email marketing OFF for one person at one
 * studio, which is the safe direction. WebCrypto, so the same code runs in
 * the Deno Edge Functions and in vitest.
 */

const enc = new TextEncoder();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signUnsubscribe(studioId: string, profileId: string, secret: string): Promise<string> {
  if (!secret) throw new Error("unsubscribe secret missing");
  const payload = enc.encode(`${studioId}:${profileId}`);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(secret), payload));
  return `${b64url(payload)}.${b64url(sig)}`;
}

export async function verifyUnsubscribe(
  token: string,
  secret: string,
): Promise<{ studioId: string; profileId: string } | null> {
  if (!secret || !token || token.length > 400) return null;
  const [p, s] = token.split(".");
  if (!p || !s) return null;
  try {
    const payload = fromB64url(p);
    const ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(s), payload);
    if (!ok) return null;
    const [studioId, profileId] = new TextDecoder().decode(payload).split(":");
    if (!UUID.test(studioId ?? "") || !UUID.test(profileId ?? "")) return null;
    return { studioId, profileId };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Opt-in confirmation (confirmed opt-in, PR #72 review)
// ---------------------------------------------------------------------------
// A box ticked on a public form doesn't prove the address belongs to the
// person ticking it. The opt-in only counts once someone with access to that
// mailbox confirms through this link. The payload carries an "optin" prefix
// and an issue time, so an unsubscribe token can never pass as a confirm token
// (or the reverse), and an old confirm link stops working.

export const OPT_IN_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export async function signOptInConfirm(
  studioId: string,
  profileId: string,
  secret: string,
  now: number = Date.now(),
): Promise<string> {
  if (!secret) throw new Error("unsubscribe secret missing");
  const payload = enc.encode(`optin:${studioId}:${profileId}:${now}`);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(secret), payload));
  return `${b64url(payload)}.${b64url(sig)}`;
}

export async function verifyOptInConfirm(
  token: string,
  secret: string,
  now: number = Date.now(),
): Promise<{ studioId: string; profileId: string; issuedAt: number } | null> {
  if (!secret || !token || token.length > 400) return null;
  const [p, s] = token.split(".");
  if (!p || !s) return null;
  try {
    const payload = fromB64url(p);
    const ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(s), payload);
    if (!ok) return null;
    const [kind, studioId, profileId, issued] = new TextDecoder().decode(payload).split(":");
    if (kind !== "optin" || !UUID.test(studioId ?? "") || !UUID.test(profileId ?? "")) return null;
    const at = Number(issued);
    if (!Number.isFinite(at) || at > now + 60_000 || now - at > OPT_IN_LINK_TTL_MS) return null;
    // The issue time lets the caller refuse a link older than a later opt-out.
    return { studioId, profileId, issuedAt: at };
  } catch {
    return null;
  }
}
