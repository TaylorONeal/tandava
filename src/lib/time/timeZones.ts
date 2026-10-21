// A small global fallback also supports browsers predating supportedValuesOf.
// The browser's current IANA list is preferred whenever it is available.
const FALLBACK_ZONES = [
  "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
  "America/Anchorage", "America/Argentina/Buenos_Aires", "America/Bogota",
  "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Mexico_City",
  "America/New_York", "America/Sao_Paulo", "America/Toronto", "America/Vancouver",
  "Asia/Bangkok", "Asia/Dubai", "Asia/Hong_Kong", "Asia/Jakarta", "Asia/Kolkata",
  "Asia/Makassar", "Asia/Manila", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Tokyo",
  "Australia/Adelaide", "Australia/Brisbane", "Australia/Melbourne", "Australia/Perth", "Australia/Sydney",
  "Europe/Amsterdam", "Europe/Berlin", "Europe/London", "Europe/Madrid", "Europe/Paris",
  "Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu",
];

function supportedTimeZones(): string[] {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
    return intl.supportedValuesOf?.("timeZone") ?? FALLBACK_ZONES;
  } catch {
    return FALLBACK_ZONES;
  }
}

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Keep stored aliases selectable even when the current browser prefers another name. */
export function timeZoneOptions(current: string, supported = supportedTimeZones()): string[] {
  return [...new Set(["UTC", current, ...supported].filter(Boolean))].sort();
}

export function timeZoneLabel(zone: string): string {
  return zone.replace(/_/g, " ").replace(/\//g, " / ");
}
