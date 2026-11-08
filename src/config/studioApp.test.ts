import { describe, expect, it } from "vitest";
import { STUDIO_APP_APPLE_ID, studioAppBannerContent } from "./studioApp";

describe("Tandava Studio Smart App Banner", () => {
  it("stays off while the app is in review", () => {
    expect(studioAppBannerContent("/manage", false, null)).toBeNull();
    expect(studioAppBannerContent("/manage/schedule", false, null)).toBeNull();
  });

  it("shows on /manage and its pages once live", () => {
    expect(studioAppBannerContent("/manage", true, null)).toBe(`app-id=${STUDIO_APP_APPLE_ID}`);
    expect(studioAppBannerContent("/manage/offerings", true, null)).toBe("app-id=6831459731");
  });

  it("never shows on member or marketing pages", () => {
    for (const path of ["/", "/for-studios", "/studio-app", "/schedule", "/managers", "/s/juniper"]) {
      expect(studioAppBannerContent(path, true, null)).toBeNull();
    }
  });

  it("never shows inside the native apps", () => {
    expect(studioAppBannerContent("/manage", true, "studio")).toBeNull();
    expect(studioAppBannerContent("/manage", true, "member")).toBeNull();
  });
});
