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
  it("binds to the attempt's nonce, then to the account; other accounts never get it", async () => {
    const { rememberSignupConsent, pendingSignupConsentFor } = await import("./session");
    expect(rememberSignupConsent(undefined, true)).toBeUndefined();
    const nonce = rememberSignupConsent("aloha", true)!;
    expect(pendingSignupConsentFor("user-b", null)).toBeNull(); // plain sign-in
    expect(pendingSignupConsentFor("user-b", "wrong")).toBeNull(); // another attempt
    expect(pendingSignupConsentFor("user-a", nonce)).toMatchObject({ slug: "aloha", granted: true });
    // Bound to user-a now: a retry for user-a works without the nonce, user-b never.
    expect(pendingSignupConsentFor("user-a", null)).toMatchObject({ slug: "aloha" });
    expect(pendingSignupConsentFor("user-b", nonce)).toBeNull();
  });

  it("keeps the choice when the save fails and clears it when it succeeds", async () => {
    const backend = await import("@/lib/backend");
    const apply = backend.data.applyMySignupConsent as unknown as ReturnType<typeof vi.fn>;
    const { rememberSignupConsent, applyOAuthSignupConsent, pendingSignupConsentFor } = await import("./session");
    const nonce = rememberSignupConsent("aloha", true)!;
    apply.mockResolvedValueOnce({ error: { message: "network" } });
    await applyOAuthSignupConsent("user-a", nonce);
    expect(pendingSignupConsentFor("user-a", null)).not.toBeNull();
    apply.mockResolvedValueOnce({ error: null });
    await applyOAuthSignupConsent("user-a", null);
    expect(pendingSignupConsentFor("user-a", null)).toBeNull();
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

describe("displaced visitor ids", () => {
  it("keeps the id an embed handoff replaced, and drops it when the account changes", async () => {
    const { getVisitorId, previousVisitorIds, claimVisitorFor } = await import("./session");
    claimVisitorFor("user-a");
    const original = getVisitorId();
    getVisitorId("22222222-2222-4222-8222-222222222222");
    expect(previousVisitorIds()).toEqual([original]);
    window.localStorage.setItem("tandava.vid.relink", "22222222-2222-4222-8222-222222222222");
    window.sessionStorage.setItem("tandava.linked.user-a", "1");
    claimVisitorFor("user-b");
    expect(window.sessionStorage.getItem("tandava.linked.user-a")).toBeNull();
    expect(previousVisitorIds()).toEqual([]);
    expect(window.localStorage.getItem("tandava.vid.relink")).toBeNull();
  });
});

describe("visit capture failures", () => {
  const stubPage = () => {
    vi.stubGlobal("window", {
      localStorage: memoryStorage(),
      sessionStorage: memoryStorage(),
      location: { href: "https://app.example.com/s/oxatl?utm_source=ig" },
    });
    vi.stubGlobal("document", { referrer: "" });
    vi.stubGlobal("navigator", { userAgent: "test" });
  };

  it("retries a capture that returned an error", async () => {
    stubPage();
    const { api } = await import("@/lib/backend");
    const invoke = vi.mocked(api.invoke);
    invoke.mockReset();
    invoke.mockResolvedValueOnce({ data: null, error: { message: "db down" } } as never);
    invoke.mockResolvedValueOnce({ data: { sessionId: "11111111-1111-4111-8111-111111111111" }, error: null } as never);
    const s = await import("./session");
    await s.trackVisit("oxatl", "storefront" as never);
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(s.currentSessionId("oxatl")).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("captureSettled redoes a capture that gave up before a booking", async () => {
    stubPage();
    const { api } = await import("@/lib/backend");
    const invoke = vi.mocked(api.invoke);
    invoke.mockReset();
    invoke.mockResolvedValue({ data: null, error: { message: "db down" } } as never);
    const s = await import("./session");
    await s.trackVisit("oxatl", "storefront" as never);
    expect(s.currentSessionId("oxatl")).toBeUndefined();
    invoke.mockResolvedValue({ data: { sessionId: "22222222-2222-4222-8222-222222222222" }, error: null } as never);
    await s.captureSettled("oxatl");
    expect(s.currentSessionId("oxatl")).toBe("22222222-2222-4222-8222-222222222222");
  });
});

describe("sign-in link retry", () => {
  it("captureSettled retries a link that settled with an error", async () => {
    const { data } = await import("@/lib/backend");
    const link = vi.mocked(data.linkMyVisitor);
    vi.mocked(data.applyMySignupConsent).mockResolvedValue({ error: null } as never);
    link.mockReset();
    link.mockResolvedValueOnce({ error: { message: "network" } } as never);
    link.mockResolvedValue({ error: null } as never);
    const s = await import("./session");
    await s.linkVisitorOnce("user-a");
    expect(link).toHaveBeenCalledTimes(1);
    await s.captureSettled();
    expect(link).toHaveBeenCalledTimes(2);
    // Linked now: no further retries.
    await s.captureSettled();
    expect(link).toHaveBeenCalledTimes(2);
  });
});

describe("embed handoff retry before booking", () => {
  it("captureSettled retries a handoff link that settled with an error", async () => {
    const { data } = await import("@/lib/backend");
    const link = vi.mocked(data.linkMyVisitor);
    link.mockReset();
    link.mockResolvedValueOnce({ error: { message: "network" } } as never);
    link.mockResolvedValue({ error: null } as never);
    window.localStorage.setItem("tandava.vid.relink", "33333333-3333-4333-8333-333333333333");
    const s = await import("./session");
    await s.retryHandoffLink();
    expect(window.localStorage.getItem("tandava.vid.relink")).not.toBeNull();
    await s.captureSettled();
    expect(link).toHaveBeenCalledTimes(2);
    expect(window.localStorage.getItem("tandava.vid.relink")).toBeNull();
  });
});

describe("session storage write failures", () => {
  it("reads the in-memory session when setItem fails but getItem works", async () => {
    const ss = memoryStorage();
    ss.setItem = () => {
      throw new Error("quota");
    };
    vi.stubGlobal("window", {
      localStorage: memoryStorage(),
      sessionStorage: ss,
      location: { href: "https://app.example.com/s/oxatl" },
    });
    vi.stubGlobal("document", { referrer: "" });
    vi.stubGlobal("navigator", { userAgent: "test" });
    const { api } = await import("@/lib/backend");
    const invoke = vi.mocked(api.invoke);
    invoke.mockReset();
    invoke.mockResolvedValue({ data: { sessionId: "44444444-4444-4444-8444-444444444444" }, error: null } as never);
    const s = await import("./session");
    await s.trackVisit("oxatl", "storefront" as never);
    expect(s.currentSessionId("oxatl")).toBe("44444444-4444-4444-8444-444444444444");
    await s.trackVisit("oxatl", "storefront" as never);
    // Same visit: the second page view reuses the token instead of starting a new session.
    const tokens = invoke.mock.calls.map((c) => (c[1] as { sessionToken: string }).sessionToken);
    expect(new Set(tokens).size).toBe(1);
  });
});

describe("capture after an account switch", () => {
  it("captureSettled recaptures when the session was cleared by claimVisitorFor", async () => {
    vi.stubGlobal("window", {
      localStorage: memoryStorage(),
      sessionStorage: memoryStorage(),
      location: { href: "https://app.example.com/s/oxatl" },
    });
    vi.stubGlobal("document", { referrer: "" });
    vi.stubGlobal("navigator", { userAgent: "test" });
    const { api } = await import("@/lib/backend");
    const invoke = vi.mocked(api.invoke);
    invoke.mockReset();
    invoke.mockResolvedValue({ data: { sessionId: "55555555-5555-4555-8555-555555555555" }, error: null } as never);
    const s = await import("./session");
    s.claimVisitorFor("user-a");
    await s.trackVisit("oxatl", "storefront" as never);
    s.claimVisitorFor("user-b"); // another tab switched accounts: sessions cleared
    expect(s.currentSessionId("oxatl")).toBeFalsy();
    invoke.mockResolvedValue({ data: { sessionId: "66666666-6666-4666-8666-666666666666" }, error: null } as never);
    await s.captureSettled("oxatl");
    expect(s.currentSessionId("oxatl")).toBe("66666666-6666-4666-8666-666666666666");
  });
});

describe("visitor ids owned by someone else", () => {
  it("drops a handoff id the server says belongs to another person", async () => {
    const { data } = await import("@/lib/backend");
    const link = vi.mocked(data.linkMyVisitor);
    link.mockReset();
    link.mockResolvedValue({ error: null, owned: false } as never);
    const foreign = "77777777-7777-4777-8777-777777777777";
    window.localStorage.setItem("tandava.vid", foreign);
    window.localStorage.setItem("tandava.vid.relink", foreign);
    const s = await import("./session");
    await s.retryHandoffLink();
    expect(window.localStorage.getItem("tandava.vid.relink")).toBeNull();
    expect(window.localStorage.getItem("tandava.vid")).not.toBe(foreign);
  });

  it("links a fresh id when the browser's id belongs to someone else", async () => {
    const { data } = await import("@/lib/backend");
    const link = vi.mocked(data.linkMyVisitor);
    vi.mocked(data.applyMySignupConsent).mockResolvedValue({ error: null } as never);
    link.mockReset();
    link.mockResolvedValueOnce({ error: null, owned: false } as never);
    link.mockResolvedValue({ error: null, owned: true } as never);
    const foreign = "88888888-8888-4888-8888-888888888888";
    window.localStorage.setItem("tandava.vid", foreign);
    const s = await import("./session");
    await s.linkVisitorOnce("user-x");
    expect(link).toHaveBeenCalledTimes(2);
    const second = link.mock.calls[1][0];
    expect(second).not.toBe(foreign);
    expect(window.localStorage.getItem("tandava.vid")).toBe(second);
  });
});

describe("account switch with in-memory fallback", () => {
  it("clears A's in-memory session when B signs in (storage writes failing)", async () => {
    const ss = memoryStorage();
    ss.setItem = () => {
      throw new Error("quota");
    };
    vi.stubGlobal("window", { localStorage: memoryStorage(), sessionStorage: ss, location: { href: "https://app.example.com/s/oxatl" } });
    vi.stubGlobal("document", { referrer: "" });
    vi.stubGlobal("navigator", { userAgent: "test" });
    const { api } = await import("@/lib/backend");
    vi.mocked(api.invoke).mockReset();
    vi.mocked(api.invoke).mockResolvedValue({ data: { sessionId: "99999999-9999-4999-8999-999999999999" }, error: null } as never);
    const s = await import("./session");
    s.claimVisitorFor("user-a");
    await s.trackVisit("oxatl", "storefront" as never);
    expect(s.currentSessionId("oxatl")).toBe("99999999-9999-4999-8999-999999999999");
    s.claimVisitorFor("user-b");
    expect(s.currentSessionId("oxatl")).toBeFalsy();
  });
});

describe("visitor id write failures", () => {
  it("uses the rotated in-memory id when localStorage.setItem fails but getItem works", async () => {
    const { getVisitorId, claimVisitorFor, forgetVisitor } = await import("./session");
    const first = getVisitorId();
    claimVisitorFor("user-a");
    window.localStorage.setItem = () => {
      throw new Error("quota");
    };
    forgetVisitor();
    const afterSignOut = getVisitorId();
    expect(afterSignOut).not.toBe(first);
    expect(getVisitorId()).toBe(afterSignOut);
    claimVisitorFor("user-b");
    expect(getVisitorId()).not.toBe(first);
  });
});

describe("capture in flight during an account switch", () => {
  it("captureSettled does not settle for the previous person's pending request", async () => {
    vi.stubGlobal("window", {
      localStorage: memoryStorage(),
      sessionStorage: memoryStorage(),
      location: { href: "https://app.example.com/s/oxatl" },
    });
    vi.stubGlobal("document", { referrer: "" });
    vi.stubGlobal("navigator", { userAgent: "test" });
    const { api } = await import("@/lib/backend");
    const invoke = vi.mocked(api.invoke);
    invoke.mockReset();
    let releaseA: (v: unknown) => void = () => {};
    invoke.mockImplementationOnce(() => new Promise((r) => (releaseA = r)) as never);
    const s = await import("./session");
    s.claimVisitorFor("user-a");
    void s.trackVisit("oxatl", "storefront" as never); // A's request hangs
    s.claimVisitorFor("user-b");
    invoke.mockResolvedValue({ data: { sessionId: "77777777-7777-4777-8777-777777777777" }, error: null } as never);
    await s.captureSettled("oxatl", 200);
    expect(s.currentSessionId("oxatl")).toBe("77777777-7777-4777-8777-777777777777");
    releaseA({ data: { sessionId: "55555555-5555-4555-8555-555555555555" }, error: null });
    await new Promise((r) => setTimeout(r, 0));
    expect(s.currentSessionId("oxatl")).toBe("77777777-7777-4777-8777-777777777777");
  });
});
