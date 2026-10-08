import { describe, it, expect } from "vitest";
import {
  CHANNEL_PRESETS,
  SHARE_CHANNEL_ORDER,
  isValidSlug,
  normalizeOrigin,
  normalizeCampaign,
  buildStorefrontUrl,
  buildClassBookingUrl,
  displayUrl,
  qrFileName,
} from "./shareLinks";
import type { ShareChannel } from "./shareLinks";

const ORIGIN = "https://oxatl.tandavastudio.com";
const SLUG = "oxatl-yoga";
const OCCURRENCE = "7f3a9c21-0000-4000-8000-000000000001";

describe("isValidSlug", () => {
  it.each(["oxatl", "oxatl-yoga", "studio-5", "a1"])("accepts %s", (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });

  it.each([
    ["a", "too short"],
    ["Oxatl-Yoga", "uppercase"],
    ["oxatl_yoga", "underscore"],
    ["-oxatl", "leading hyphen"],
    ["oxatl-", "trailing hyphen"],
    ["oxatl--yoga", "double hyphen"],
    ["oxatl yoga", "space"],
    ["oxatl.yoga", "dot"],
    ["", "empty"],
  ])("rejects %s (%s)", (slug) => {
    expect(isValidSlug(slug)).toBe(false);
  });

  it("rejects a slug longer than a DNS label", () => {
    expect(isValidSlug("a".repeat(63))).toBe(true);
    expect(isValidSlug("a".repeat(64))).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isValidSlug(null)).toBe(false);
    expect(isValidSlug(undefined)).toBe(false);
  });
});

describe("normalizeOrigin", () => {
  it("strips trailing slashes so joins never double up", () => {
    expect(normalizeOrigin("https://x.com/")).toBe("https://x.com");
    expect(normalizeOrigin("https://x.com///")).toBe("https://x.com");
    expect(normalizeOrigin("  https://x.com  ")).toBe("https://x.com");
  });

  it("handles nothing gracefully", () => {
    expect(normalizeOrigin(null)).toBe("");
    expect(normalizeOrigin(undefined)).toBe("");
  });
});

describe("normalizeCampaign", () => {
  it("lowercases and hyphenates", () => {
    expect(normalizeCampaign("Spring Challenge 2026")).toBe("spring-challenge-2026");
    expect(normalizeCampaign("new_student__offer")).toBe("new-student-offer");
  });

  it("trims leading and trailing separators", () => {
    expect(normalizeCampaign("  --spring--  ")).toBe("spring");
  });

  it("returns empty for nothing usable", () => {
    expect(normalizeCampaign("")).toBe("");
    expect(normalizeCampaign("   ")).toBe("");
    expect(normalizeCampaign("!!!")).toBe("");
    expect(normalizeCampaign(null)).toBe("");
  });
});

describe("buildStorefrontUrl", () => {
  it("builds the plain branded link", () => {
    expect(buildStorefrontUrl({ origin: ORIGIN, slug: SLUG })).toBe(`${ORIGIN}/s/${SLUG}`);
  });

  it("leaves a direct link completely clean", () => {
    // An owner pasting into their Instagram bio should get no query string at
    // all, not an empty one.
    const url = buildStorefrontUrl({ origin: ORIGIN, slug: SLUG, channel: "direct" });
    expect(url).toBe(`${ORIGIN}/s/${SLUG}`);
    expect(url).not.toContain("?");
  });

  it("tags a channel", () => {
    const url = buildStorefrontUrl({ origin: ORIGIN, slug: SLUG, channel: "instagram_bio" });
    expect(url).toBe(`${ORIGIN}/s/${SLUG}?utm_source=instagram&utm_medium=bio`);
  });

  it("adds a normalized campaign when given one", () => {
    const url = buildStorefrontUrl({
      origin: ORIGIN,
      slug: SLUG,
      channel: "linktree",
      campaign: "Spring Challenge",
    });
    expect(url).toContain("utm_source=linktree");
    expect(url).toContain("utm_campaign=spring-challenge");
  });

  it("omits an unusable campaign rather than emitting an empty parameter", () => {
    const url = buildStorefrontUrl({ origin: ORIGIN, slug: SLUG, channel: "linktree", campaign: "  !!  " });
    expect(url).not.toContain("utm_campaign");
  });

  it("does not double the slash when the origin has a trailing one", () => {
    expect(buildStorefrontUrl({ origin: `${ORIGIN}/`, slug: SLUG })).toBe(`${ORIGIN}/s/${SLUG}`);
  });

  it("escapes a slug rather than letting it alter the path", () => {
    const url = buildStorefrontUrl({ origin: ORIGIN, slug: "a/b" });
    expect(url).toBe(`${ORIGIN}/s/a%2Fb`);
  });
});

describe("buildClassBookingUrl", () => {
  it("points at the one-tap booking page for that occurrence", () => {
    expect(buildClassBookingUrl({ origin: ORIGIN, slug: SLUG, occurrenceId: OCCURRENCE })).toBe(
      `${ORIGIN}/s/${SLUG}/book/${OCCURRENCE}`,
    );
  });

  it("tags a channel the same way the storefront does", () => {
    const url = buildClassBookingUrl({
      origin: ORIGIN,
      slug: SLUG,
      occurrenceId: OCCURRENCE,
      channel: "instagram_story",
    });
    expect(url).toContain(`/s/${SLUG}/book/${OCCURRENCE}?`);
    expect(url).toContain("utm_source=instagram");
    expect(url).toContain("utm_medium=story");
  });

  it("escapes the occurrence id", () => {
    const url = buildClassBookingUrl({ origin: ORIGIN, slug: SLUG, occurrenceId: "x y/z" });
    expect(url).toBe(`${ORIGIN}/s/${SLUG}/book/x%20y%2Fz`);
  });
});

describe("channel presets", () => {
  it("covers every channel in the display order", () => {
    for (const channel of SHARE_CHANNEL_ORDER) {
      expect(CHANNEL_PRESETS[channel]).toBeDefined();
    }
  });

  it("offers every defined channel in the display order", () => {
    const defined = Object.keys(CHANNEL_PRESETS) as ShareChannel[];
    expect([...SHARE_CHANNEL_ORDER].sort()).toEqual([...defined].sort());
  });

  it("keeps utm values lowercase so reports never split one source in two", () => {
    for (const [, preset] of Object.entries(CHANNEL_PRESETS)) {
      expect(preset.utmSource).toBe(preset.utmSource.toLowerCase());
      expect(preset.utmMedium).toBe(preset.utmMedium.toLowerCase());
    }
  });

  it("gives every channel owner-facing copy", () => {
    for (const [, preset] of Object.entries(CHANNEL_PRESETS)) {
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.hint.length).toBeGreaterThan(0);
      // The picker is for studio owners, not analysts.
      expect(preset.label).not.toContain("utm");
    }
  });

  it("uses one source for the two Instagram placements, distinguished by medium", () => {
    expect(CHANNEL_PRESETS.instagram_bio.utmSource).toBe(CHANNEL_PRESETS.instagram_story.utmSource);
    expect(CHANNEL_PRESETS.instagram_bio.utmMedium).not.toBe(CHANNEL_PRESETS.instagram_story.utmMedium);
  });
});

describe("displayUrl", () => {
  it("drops the scheme and www", () => {
    expect(displayUrl("https://www.oxatl.com/s/oxatl-yoga")).toBe("oxatl.com/s/oxatl-yoga");
  });

  it("leaves a short link alone", () => {
    expect(displayUrl("https://x.com/s/y")).toBe("x.com/s/y");
  });

  it("truncates the middle, keeping the slug visible", () => {
    const long = `${ORIGIN}/s/${SLUG}?utm_source=instagram&utm_medium=bio&utm_campaign=spring-challenge-2026`;
    const shown = displayUrl(long, 48);
    expect(shown.length).toBeLessThanOrEqual(48);
    expect(shown).toContain("…");
    // The point of truncating the middle rather than the end.
    expect(shown).toContain("oxatl");
  });

  it("handles nothing gracefully", () => {
    expect(displayUrl("")).toBe("");
  });
});

describe("qrFileName", () => {
  it("names the file after the studio and what it does", () => {
    expect(qrFileName("oxatl-yoga")).toBe("oxatl-yoga-booking-qr.png");
    expect(qrFileName("oxatl-yoga", "class")).toBe("oxatl-yoga-class-booking-qr.png");
  });

  it("normalizes a messy slug rather than producing an unsaveable name", () => {
    expect(qrFileName("Oxatl Yoga!")).toBe("oxatl-yoga-booking-qr.png");
  });

  it("falls back to a usable name when the slug is empty", () => {
    expect(qrFileName("")).toBe("studio-booking-qr.png");
  });
});
