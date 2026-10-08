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

describe("localStorage reads work but writes fail", () => {
  const breakWrites = () => {
    window.localStorage.setItem = () => {
      throw new Error("quota");
    };
    window.localStorage.removeItem = () => {
      throw new Error("quota");
    };
  };

  it("keeps a handoff link pending in memory and retries it before booking", async () => {
    const { data } = await import("@/lib/backend");
    const link = vi.mocked(data.linkMyVisitor);
    link.mockReset();
    link.mockResolvedValueOnce({ error: { message: "network" }, owned: null } as never);
    link.mockResolvedValue({ error: null, owned: true } as never);
    const s = await import("./session");
    s.getVisitorId();
    breakWrites();
    const handoff = "44444444-4444-4444-8444-444444444444";
    expect(s.getVisitorId(handoff)).toBe(handoff);
    await s.retryHandoffLink(); // the first attempt fails
    await s.captureSettled();
    expect(link).toHaveBeenLastCalledWith(handoff, "embed_handoff");
    expect(link).toHaveBeenCalledTimes(2);
  });

  it("an account switch rotates once, not on every later auth event", async () => {
    const s = await import("./session");
    s.claimVisitorFor("user-a");
    const a = s.getVisitorId();
    breakWrites();
    s.claimVisitorFor("user-b");
    const b = s.getVisitorId();
    expect(b).not.toBe(a);
    s.claimVisitorFor("user-b");
    expect(s.getVisitorId()).toBe(b);
  });
});

describe("sessionStorage reads work but removes fail", () => {
  it("an account switch does not reuse the previous person's stored session", async () => {
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
    expect(s.currentSessionId("oxatl")).toBe("55555555-5555-4555-8555-555555555555");
    window.sessionStorage.removeItem = () => {
      throw new Error("blocked");
    };
    s.claimVisitorFor("user-b");
    expect(s.currentSessionId("oxatl")).toBeFalsy();
    expect(s.checkoutAttribution().sessionId).toBeUndefined();
    invoke.mockResolvedValue({ data: { sessionId: "66666666-6666-4666-8666-666666666666" }, error: null } as never);
    await s.captureSettled("oxatl");
    expect(s.currentSessionId("oxatl")).toBe("66666666-6666-4666-8666-666666666666");
  });
});

describe("expired session before booking", () => {
  it("captureSettled starts a new visit when the stored one timed out", async () => {
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
    await s.trackVisit("oxatl", "storefront" as never);
    const key = "tandava.sess.oxatl";
    const stored = JSON.parse(window.sessionStorage.getItem(key)!);
    window.sessionStorage.setItem(key, JSON.stringify({ ...stored, last: Date.now() - 31 * 60_000 }));
    invoke.mockResolvedValue({ data: { sessionId: "66666666-6666-4666-8666-666666666666" }, error: null } as never);
    await s.captureSettled("oxatl");
    expect(s.currentSessionId("oxatl")).toBe("66666666-6666-4666-8666-666666666666");
  });
});

describe("signed-out cold load", () => {
  it("rotates an id still owned by the previous account, but not a plain anonymous one", async () => {
    const s = await import("./session");
    const anon = s.getVisitorId();
    s.forgetVisitorIfOwned();
    expect(s.getVisitorId()).toBe(anon);
    s.claimVisitorFor("user-a");
    const owned = s.getVisitorId();
    s.forgetVisitorIfOwned();
    expect(s.getVisitorId()).not.toBe(owned);
    expect(window.localStorage.getItem("tandava.vid.owner")).toBeNull();
  });
});

describe("cold load with an id owned by a signed-out account", () => {
  it("holds the first page view until auth resolves, then records it under a fresh id", async () => {
    vi.stubGlobal("window", {
      localStorage: memoryStorage(),
      sessionStorage: memoryStorage(),
      location: { href: "https://app.example.com/s/oxatl" },
    });
    vi.stubGlobal("document", { referrer: "" });
    vi.stubGlobal("navigator", { userAgent: "test" });
    const first = await import("./session");
    first.claimVisitorFor("user-a");
    const owned = first.getVisitorId();
    vi.resetModules(); // a new page load; storage persists
    const { api } = await import("@/lib/backend");
    const invoke = vi.mocked(api.invoke);
    invoke.mockReset();
    invoke.mockResolvedValue({ data: { sessionId: "77777777-7777-4777-8777-777777777777" }, error: null } as never);
    const s = await import("./session");
    const capture = s.trackVisit("oxatl", "storefront" as never);
    await new Promise((r) => setTimeout(r, 20));
    expect(invoke).not.toHaveBeenCalled();
    s.resolveVisitorIdentity(null); // auth: nobody signed in
    await capture;
    expect(invoke).toHaveBeenCalledTimes(1);
    const body = invoke.mock.calls[0][1] as { visitorId?: string };
    expect(body.visitorId).toBeDefined();
    expect(body.visitorId).not.toBe(owned);
  });
});

describe("overlapping captures for one studio", () => {
  it("a second page view waits for the tagged one in flight, and captureSettled covers both", async () => {
    vi.stubGlobal("window", {
      localStorage: memoryStorage(),
      sessionStorage: memoryStorage(),
      location: { href: "https://app.example.com/s/oxatl?utm_source=ig" },
    });
    vi.stubGlobal("document", { referrer: "" });
    vi.stubGlobal("navigator", { userAgent: "test" });
    const { api } = await import("@/lib/backend");
    const invoke = vi.mocked(api.invoke);
    invoke.mockReset();
    let releaseTagged: (v: unknown) => void = () => {};
    invoke.mockImplementationOnce(() => new Promise((r) => (releaseTagged = r)) as never);
    invoke.mockResolvedValue({ data: { sessionId: "88888888-8888-4888-8888-888888888888" }, error: null } as never);
    const s = await import("./session");
    void s.trackVisit("oxatl", "storefront" as never); // tagged, hangs
    (window as unknown as { location: { href: string } }).location.href = "https://app.example.com/s/oxatl/book";
    void s.trackVisit("oxatl", "booking" as never); // untagged
    await new Promise((r) => setTimeout(r, 20));
    expect(invoke).toHaveBeenCalledTimes(1); // the second waits
    let settled = false;
    const wait = s.captureSettled("oxatl", 5000).then(() => (settled = true));
    await new Promise((r) => setTimeout(r, 20));
    expect(settled).toBe(false);
    releaseTagged({ data: { sessionId: "88888888-8888-4888-8888-888888888888" }, error: null });
    await wait;
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});

describe("a capture request that hangs", () => {
  it("times out so the next capture for the studio still runs", async () => {
    vi.useFakeTimers();
    try {
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
      invoke.mockImplementation(() => new Promise(() => {}) as never); // never settles
      const s = await import("./session");
      const first = s.trackVisit("oxatl", "storefront" as never);
      await vi.advanceTimersByTimeAsync(120_000);
      await first; // finished despite every attempt hanging
      invoke.mockReset();
      invoke.mockResolvedValue({ data: { sessionId: "99999999-9999-4999-8999-999999999999" }, error: null } as never);
      await s.trackVisit("oxatl", "booking" as never);
      expect(s.currentSessionId("oxatl")).toBe("99999999-9999-4999-8999-999999999999");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("copied handoff link opened by a signed-in person (PR #72 review)", () => {
  it("captures under a fresh id, never the other person's handoff id", async () => {
    const foreign = "99999999-9999-4999-8999-999999999999";
    vi.stubGlobal("window", {
      localStorage: memoryStorage(),
      sessionStorage: memoryStorage(),
      location: { href: `https://app.example.com/s/oxatl?tv=${foreign}` },
    });
    vi.stubGlobal("document", { referrer: "" });
    vi.stubGlobal("navigator", { userAgent: "test" });
    const { api, data } = await import("@/lib/backend");
    const link = vi.mocked(data.linkMyVisitor);
    link.mockReset();
    // The server answers a moment later: the id belongs to someone else.
    link.mockImplementation(() => new Promise((r) => setTimeout(() => r({ error: null, owned: false } as never), 20)));
    const invoke = vi.mocked(api.invoke);
    invoke.mockReset();
    invoke.mockResolvedValue({ data: { sessionId: "12121212-1212-4212-8212-121212121212" }, error: null } as never);
    const s = await import("./session");
    await s.trackVisit("oxatl", "storefront" as never);
    const sent = (invoke.mock.calls.at(-1)?.[1] as { visitorId: string }).visitorId;
    expect(sent).not.toBe(foreign);
    expect(sent).toBe(window.localStorage.getItem("tandava.vid"));
  });
});

describe("handoff ownership that doesn't answer in time (PR #72 review)", () => {
  it("skips the capture instead of sending the unverified handoff id", async () => {
    vi.useFakeTimers();
    try {
      const foreign = "abababab-abab-4bab-8bab-abababababab";
      vi.stubGlobal("window", {
        localStorage: memoryStorage(),
        sessionStorage: memoryStorage(),
        location: { href: `https://app.example.com/s/oxatl?tv=${foreign}` },
      });
      vi.stubGlobal("document", { referrer: "" });
      vi.stubGlobal("navigator", { userAgent: "test" });
      const { api, data } = await import("@/lib/backend");
      const link = vi.mocked(data.linkMyVisitor);
      link.mockReset();
      link.mockImplementation(() => new Promise(() => {})); // never answers
      const invoke = vi.mocked(api.invoke);
      invoke.mockReset();
      const s = await import("./session");
      const p = s.trackVisit("oxatl", "storefront" as never);
      await vi.advanceTimersByTimeAsync(5000);
      await p;
      expect(invoke).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("auth slower than the identity wait (PR #72 review)", () => {
  it("captures only after auth answers, under the rotated id", async () => {
    vi.useFakeTimers();
    try {
      const prior = "cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd";
      vi.stubGlobal("window", {
        localStorage: memoryStorage(),
        sessionStorage: memoryStorage(),
        location: { href: "https://app.example.com/s/oxatl" },
      });
      vi.stubGlobal("document", { referrer: "" });
      vi.stubGlobal("navigator", { userAgent: "test" });
      window.localStorage.setItem("tandava.vid", prior);
      window.localStorage.setItem("tandava.vid.owner", "user-a");
      const { api } = await import("@/lib/backend");
      const invoke = vi.mocked(api.invoke);
      invoke.mockReset();
      invoke.mockResolvedValue({ data: { sessionId: "34343434-3434-4434-8434-343434343434" }, error: null } as never);
      const s = await import("./session");
      const p = s.trackVisit("oxatl", "storefront" as never);
      await vi.advanceTimersByTimeAsync(2000);
      await p;
      expect(invoke).not.toHaveBeenCalled();
      // Auth answers late: signed out, so the id is rotated before capture.
      s.resolveVisitorIdentity(null);
      await vi.advanceTimersByTimeAsync(10);
      await s.captureSettled("oxatl");
      const sent = (invoke.mock.calls.at(-1)?.[1] as { visitorId: string }).visitorId;
      expect(sent).not.toBe(prior);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("a stalled visitor-link request (PR #72 review)", () => {
  it("settles, so a later retry can link", async () => {
    vi.useFakeTimers();
    try {
      const { data } = await import("@/lib/backend");
      const link = vi.mocked(data.linkMyVisitor);
      vi.mocked(data.applyMySignupConsent).mockResolvedValue({ error: null } as never);
      link.mockReset();
      link.mockImplementationOnce(() => new Promise(() => {})); // hangs
      link.mockResolvedValue({ error: null, owned: true } as never);
      const s = await import("./session");
      const first = s.linkVisitorOnce("user-z");
      await vi.advanceTimersByTimeAsync(9000);
      await first;
      s.retryPendingLink();
      await vi.advanceTimersByTimeAsync(10);
      expect(link.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
