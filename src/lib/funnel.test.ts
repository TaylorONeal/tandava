import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { resetActivationMemory, resetSuperProperties, setFunnelSink, setSuperProperties, trackActivation, trackCheckin, trackFunnel } from "./funnel";

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
  vi.stubGlobal("window", { localStorage: memoryStorage() });
  resetActivationMemory();
});

afterEach(() => {
  setFunnelSink(null);
  resetSuperProperties();
  vi.unstubAllGlobals();
});

describe("trackFunnel", () => {
  it("is a no-op without a sink", () => {
    expect(() => trackFunnel("discover_viewed")).not.toThrow();
  });
  it("forwards event and props to the sink", () => {
    const sink = vi.fn();
    setFunnelSink(sink);
    trackFunnel("class_opened", { studio: "oxatl" });
    expect(sink).toHaveBeenCalledWith("class_opened", { studio: "oxatl" });
  });
  it("swallows sink errors so booking never breaks", () => {
    setFunnelSink(() => {
      throw new Error("boom");
    });
    expect(() => trackFunnel("booking_completed")).not.toThrow();
  });
  it("adds super properties to every event, and event props cannot override them", () => {
    const sink = vi.fn();
    setFunnelSink(sink);
    setSuperProperties({ app: "tandava", platform: "web", schema_version: 1 });
    trackFunnel("discover_viewed", { app: "spoofed", kind: "x" });
    expect(sink).toHaveBeenCalledWith("discover_viewed", { app: "tandava", platform: "web", schema_version: 1, kind: "x" });
  });
});

describe("shared taxonomy derived from the funnel", () => {
  it("a confirmed booking is a key action and, once per browser, activation", () => {
    const sink = vi.fn();
    setFunnelSink(sink);
    trackFunnel("booking_completed", { status: "confirmed" });
    trackFunnel("booking_completed", { status: "confirmed" });
    const names = sink.mock.calls.map((c) => c[0]);
    expect(names).toEqual(["booking_completed", "key_action", "activation_reached", "booking_completed", "key_action"]);
    expect(sink).toHaveBeenCalledWith("activation_reached", { action: "first_booking" });
  });
  it("a waitlist spot is not activation", () => {
    const sink = vi.fn();
    setFunnelSink(sink);
    trackFunnel("booking_completed", { status: "waitlisted" });
    expect(sink.mock.calls.map((c) => c[0])).toEqual(["booking_completed"]);
  });
  it("checkout_started also emits purchase_started with the product kind", () => {
    const sink = vi.fn();
    setFunnelSink(sink);
    trackFunnel("checkout_started", { kind: "class_pack" });
    expect(sink).toHaveBeenCalledWith("purchase_started", { product_id: "class_pack" });
  });
  it("a confirmed check-in is the studio's activation, once", () => {
    const sink = vi.fn();
    setFunnelSink(sink);
    trackCheckin();
    trackCheckin();
    expect(sink.mock.calls.filter((c) => c[0] === "activation_reached")).toEqual([["activation_reached", { action: "first_checkin" }]]);
    expect(sink.mock.calls.filter((c) => c[0] === "key_action")).toHaveLength(2);
  });
  it("remembers nothing while analytics is off", () => {
    trackActivation("first_booking");
    const sink = vi.fn();
    setFunnelSink(sink);
    trackActivation("first_booking");
    expect(sink).toHaveBeenCalledWith("activation_reached", { action: "first_booking" });
  });
});
