import { describe, expect, it, vi } from "vitest";
import {
  captchaEnabled,
  captchaOption,
  getCaptchaState,
  getCaptchaToken,
  onCaptchaReset,
  setCaptchaFailed,
  setCaptchaToken,
  takeCaptchaToken,
} from "./captcha";

describe("captcha token store", () => {
  it("is off without a site key", () => {
    expect(captchaEnabled("")).toBe(false);
    expect(captchaEnabled("0x4AAA")).toBe(true);
  });

  it("hands a token to exactly one auth call", () => {
    setCaptchaToken("tok-1");
    expect(takeCaptchaToken()).toBe("tok-1");
    expect(takeCaptchaToken()).toBeUndefined();
    expect(getCaptchaToken()).toBeNull();
  });

  it("asks widgets for a fresh token after one is used", () => {
    const reset = vi.fn();
    const off = onCaptchaReset(reset);
    setCaptchaToken("tok-2");
    takeCaptchaToken();
    expect(reset).toHaveBeenCalledTimes(1);
    off();
  });

  it("adds captchaToken to auth options only when present", () => {
    expect(captchaOption()).toEqual({});
    setCaptchaToken("tok-3");
    expect(captchaOption()).toEqual({ captchaToken: "tok-3" });
  });

  it("reports a failed widget so forms are not locked out", () => {
    setCaptchaFailed(true);
    expect(getCaptchaState()).toBe("failed");
    setCaptchaToken("tok-4");
    expect(getCaptchaState()).toBe("token");
    takeCaptchaToken();
    setCaptchaFailed(false);
    expect(getCaptchaState()).toBe("none");
  });
});
