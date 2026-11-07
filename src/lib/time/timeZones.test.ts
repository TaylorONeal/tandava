import { describe, expect, it } from "vitest";
import { timeZoneLabel, timeZoneOptions } from "./timeZones";

describe("studio time zones", () => {
  it("preserves a saved alias that the browser's canonical list does not include", () => {
    expect(timeZoneOptions("Asia/Calcutta", ["Asia/Kolkata", "Europe/London"])).toEqual([
      "Asia/Calcutta", "Asia/Kolkata", "Europe/London", "UTC",
    ]);
  });

  it("keeps UTC and removes duplicate values", () => {
    expect(timeZoneOptions("UTC", ["UTC", "Asia/Makassar", "Asia/Makassar"])).toEqual(["Asia/Makassar", "UTC"]);
  });

  it("uses city and region names without changing their stored IANA identifiers", () => {
    expect(timeZoneLabel("America/Argentina/Buenos_Aires")).toBe("America / Argentina / Buenos Aires");
  });
});
