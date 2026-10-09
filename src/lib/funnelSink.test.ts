import { describe, it, expect, vi } from "vitest";
import { postHogSink, funnelSinkFromEnv } from "./funnelSink";

describe("postHogSink", () => {
  it("posts the event with an anonymous id to the capture endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null));
    const sink = postHogSink({ key: "phc_test", host: "https://eu.i.posthog.com/", distinctId: () => "v-1", fetchImpl });
    sink("checkout_started", { kind: "class_pack" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://eu.i.posthog.com/i/v0/e/");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ api_key: "phc_test", event: "checkout_started", distinct_id: "v-1" });
    expect(body.properties.kind).toBe("class_pack");
  });
  it("never throws when the network fails", () => {
    const sink = postHogSink({ key: "k", distinctId: () => "v", fetchImpl: vi.fn().mockRejectedValue(new Error("offline")) });
    expect(() => sink("discover_viewed")).not.toThrow();
  });
});

describe("funnelSinkFromEnv", () => {
  it("is off without a key", () => {
    expect(funnelSinkFromEnv({}, () => "v")).toBeNull();
    expect(funnelSinkFromEnv({ VITE_POSTHOG_KEY: " " }, () => "v")).toBeNull();
  });
  it("is on with a key", () => {
    expect(funnelSinkFromEnv({ VITE_POSTHOG_KEY: "phc_x" }, () => "v")).toBeTypeOf("function");
  });
});
