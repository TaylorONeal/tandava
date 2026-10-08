import { describe, it, expect, vi, afterEach } from "vitest";
import { setFunnelSink, trackFunnel } from "./funnel";

afterEach(() => setFunnelSink(null));

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
});
