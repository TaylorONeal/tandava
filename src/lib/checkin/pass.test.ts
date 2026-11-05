import { describe, expect, it } from "vitest";
import { describeScan, passFor, PASS_PREFIX, readPass } from "./pass";

const id = "a1b2c3d4-0000-4000-8000-00000000abcd";

describe("check-in pass", () => {
  it("round-trips a booking id", () => {
    expect(passFor(id)).toBe(PASS_PREFIX + id);
    expect(readPass(passFor(id))).toBe(PASS_PREFIX + id);
  });
  it("normalises case and whitespace in the id only", () => {
    expect(readPass(`  ${PASS_PREFIX}${id.toUpperCase()}\n`)).toBe(PASS_PREFIX + id);
    expect(readPass(PASS_PREFIX.toUpperCase() + id)).toBeNull();
  });
  it("rejects anything else", () => {
    for (const raw of ["", null, undefined, id, `https://tandavastudio.com/${id}`, `${PASS_PREFIX}not-a-uuid`, `${PASS_PREFIX}${id}x`]) {
      expect(readPass(raw as string)).toBeNull();
    }
    expect(() => passFor("nope")).toThrow();
  });
  it("describes every server result", () => {
    expect(describeScan("checked_in", "Sam").tone).toBe("success");
    expect(describeScan("already_checked_in", "Sam").tone).toBe("warning");
    expect(describeScan("not_found", null).title).toBe("Pass not found");
    expect(describeScan("invalid_pass", null).tone).toBe("error");
  });
});
