import { describe, expect, it } from "vitest";
import { classifyChannel } from "./channel";

describe("classifyChannel: studios' own tags land in one grouping", () => {
  it.each([
    [{ utmSource: "instagram", utmMedium: "bio" }, "organic_social"],
    [{ utmSource: "ig", utmMedium: "linkinbio" }, "organic_social"],
    [{ utmSource: "Instagram", utmMedium: "social" }, "organic_social"],
    [{ utmSource: "linktree", utmMedium: "link_in_bio" }, "organic_social"],
    [{ utmSource: "teachertree", utmMedium: "link_in_bio" }, "organic_social"],
    [{ referrer: "https://l.instagram.com/?u=x" }, "organic_social"],
    [{ utmSource: "facebook", utmMedium: "paid_social", fbclid: "abc" }, "paid_social"],
    [{ utmSource: "meta", utmMedium: "cpc" }, "paid_social"],
    [{ fbclid: "abc" }, "organic_social"],
    [{ gclid: "x" }, "paid_search"],
    [{ wbraid: "x" }, "paid_search"],
    [{ utmSource: "google", utmMedium: "cpc" }, "paid_search"],
    [{ referrer: "https://www.google.com/" }, "organic_search"],
    [{ utmSource: "newsletter", utmMedium: "email" }, "email"],
    [{ utmMedium: "sms" }, "sms"],
    [{ utmSource: "print", utmMedium: "qr" }, "qr"],
    [{ utmMedium: "embed" }, "embed"],
    [{ referrer: "https://oxatlyoga.com/schedule", studioSiteHost: "oxatlyoga.com" }, "embed"],
    [{ utmMedium: "network" }, "network"],
    [{ referrer: "https://austinchronicle.com/yoga" }, "referral"],
    [{}, "direct"],
  ])("%j → %s", (input, expected) => {
    expect(classifyChannel(input)).toBe(expected);
  });
});
