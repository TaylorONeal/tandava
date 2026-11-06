import { describe, it, expect } from "vitest";
import { SUPPORT_ITEMS } from "./index";

describe("support page", () => {
  it("matches what the Studio app does", () => {
    const text = JSON.stringify(SUPPORT_ITEMS);
    expect(text).toContain("60 minutes");
    expect(text).toContain("Settings > Tandava Studio > Camera");
    expect(text).not.toMatch(/sign up|create an account/i);
    expect(text).not.toContain("—");
  });
});
