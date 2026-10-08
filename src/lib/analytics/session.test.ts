import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/backend", () => ({ api: { invoke: vi.fn() }, data: { linkMyVisitor: vi.fn(), applyMySignupConsent: vi.fn() } }));

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: memoryStorage(), sessionStorage: memoryStorage() });
  vi.resetModules();
});

describe("claimVisitorFor", () => {
  it("keeps the visitor id for the same person and rotates it for a different one", async () => {
    const { getVisitorId, claimVisitorFor } = await import("./session");
    const first = getVisitorId();
    window.sessionStorage.setItem("tandava.sess.aloha", "{}");
    claimVisitorFor("user-a");
    expect(getVisitorId()).toBe(first);
    claimVisitorFor("user-a");
    expect(getVisitorId()).toBe(first);
    claimVisitorFor("user-b");
    expect(getVisitorId()).not.toBe(first);
    expect(window.sessionStorage.getItem("tandava.sess.aloha")).toBeNull();
  });
});

describe("getVisitorId", () => {
  it("adopts an embed handoff id over a stored one", async () => {
    const { getVisitorId } = await import("./session");
    const stored = getVisitorId();
    const handoff = "11111111-1111-4111-8111-111111111111";
    expect(getVisitorId(handoff)).toBe(handoff);
    expect(getVisitorId()).toBe(handoff);
    expect(stored).not.toBe(handoff);
  });
});

describe("signup consent across OAuth", () => {
  it("applies only to the attempt that carries the nonce, once", async () => {
    const { rememberSignupConsent, takeSignupConsent } = await import("./session");
    expect(rememberSignupConsent(undefined, true)).toBeUndefined();
    const nonce = rememberSignupConsent("aloha", true);
    expect(nonce).toBeTruthy();
    expect(takeSignupConsent("someone-else")).toBeNull(); // wrong attempt: discarded
    const again = rememberSignupConsent("aloha", true);
    expect(takeSignupConsent(null)).toBeNull(); // plain sign-in: discarded
    const third = rememberSignupConsent("aloha", false);
    expect(takeSignupConsent(third)).toMatchObject({ slug: "aloha", granted: false });
    expect(takeSignupConsent(third)).toBeNull();
    expect(again).not.toBe(third);
  });
});

describe("forgetVisitor", () => {
  it("gives the browser a fresh id and drops sessions on sign-out", async () => {
    const { getVisitorId, claimVisitorFor, forgetVisitor } = await import("./session");
    claimVisitorFor("user-a");
    const before = getVisitorId();
    window.sessionStorage.setItem("tandava.sess.aloha", "{}");
    forgetVisitor();
    expect(getVisitorId()).not.toBe(before);
    expect(window.sessionStorage.getItem("tandava.sess.aloha")).toBeNull();
    expect(window.localStorage.getItem("tandava.vid.owner")).toBeNull();
  });
});
