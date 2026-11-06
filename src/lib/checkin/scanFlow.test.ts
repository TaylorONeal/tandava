import { describe, expect, it, vi } from "vitest";
import { runScan } from "./scanFlow";
import { PASS_PREFIX } from "./pass";
import type { PassScan } from "@/lib/backend/types";

const id = "a1b2c3d4-0000-4000-8000-00000000abcd";
const row = (over: Partial<PassScan>): PassScan => ({
  result: "checked_in", booking_id: id, student_name: "Sam Rivera", offering_name: "Morning Flow",
  starts_at: "2026-11-06T15:00:00Z", studio_timezone: "America/Chicago", ...over,
});

describe("runScan", () => {
  it("returns null when the scanner is closed and never calls the server", async () => {
    const check = vi.fn();
    expect(await runScan(async () => ({ kind: "cancelled" }), check)).toBeNull();
    expect(check).not.toHaveBeenCalled();
  });
  it("rejects a foreign QR code before reaching the server", async () => {
    const check = vi.fn();
    const v = await runScan(async () => ({ kind: "code", value: "https://example.com" }), check);
    expect(v?.title).toBe("Not a Tandava pass");
    expect(check).not.toHaveBeenCalled();
  });
  it("sends the normalised pass and reports recorded attendance with the class", async () => {
    const check = vi.fn(async () => ({ data: row({}), error: null }));
    const v = await runScan(async () => ({ kind: "code", value: ` ${PASS_PREFIX}${id.toUpperCase()} ` }), check);
    expect(check).toHaveBeenCalledWith(PASS_PREFIX + id);
    expect(v).toMatchObject({ tone: "success", recorded: true, title: "Sam Rivera is checked in" });
    expect(v?.detail).toContain("Morning Flow · 9:00 AM");
  });
  it("does not count a repeat scan", async () => {
    const v = await runScan(async () => ({ kind: "code", value: PASS_PREFIX + id }), async () => ({ data: row({ result: "already_checked_in" }), error: null }));
    expect(v).toMatchObject({ tone: "warning", recorded: false });
  });
  it("hides other studios' bookings", async () => {
    const v = await runScan(async () => ({ kind: "code", value: PASS_PREFIX + id }), async () => ({ data: row({ result: "not_found", student_name: null, offering_name: null, starts_at: null }), error: null }));
    expect(v).toMatchObject({ title: "Pass not found", recorded: false });
  });
  it("turns server and network failures into a retryable error", async () => {
    const a = await runScan(async () => ({ kind: "code", value: PASS_PREFIX + id }), async () => ({ data: null, error: { message: "JWT expired" } }));
    expect(a).toMatchObject({ title: "Not recorded", detail: "JWT expired", recorded: false });
    const b = await runScan(async () => ({ kind: "code", value: PASS_PREFIX + id }), async () => { throw new Error("offline"); });
    expect(b).toMatchObject({ title: "Not recorded", recorded: false });
  });
  it("passes scanner errors through", async () => {
    const v = await runScan(async () => ({ kind: "error", message: "Camera access is off." }), vi.fn());
    expect(v).toMatchObject({ title: "Scanner unavailable", tone: "error" });
  });
});
