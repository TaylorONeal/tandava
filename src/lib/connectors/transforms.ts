/**
 * Field value transforms for the data importer.
 *
 * These are the functions referenced by `import_field_mappings.transform_function`
 * (e.g. "to_date", "to_cents", "to_phone"). They normalize the wide range of
 * formats other platforms export into the shapes Tandava's schema expects.
 */

/** Parse a date in common export formats → ISO 8601 date (YYYY-MM-DD), or null. */
export function toDate(value: string): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;

  // Already ISO (YYYY-MM-DD or full timestamp)
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // M/D/YYYY or MM/DD/YYYY (US — the dominant export format)
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(v);
  if (us) {
    const [, m, d, rawY] = us;
    const y = rawY.length === 2 ? (parseInt(rawY, 10) > 50 ? "19" : "20") + rawY : rawY;
    const mm = m.padStart(2, "0");
    const dd = d.padStart(2, "0");
    if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31) return `${y}-${mm}-${dd}`;
    return null;
  }

  // Fallback to Date parsing (e.g. "Jan 15, 2025")
  const parsed = new Date(v);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

/** Parse a currency/amount string → integer cents, or null. */
export function toCents(value: string): number | null {
  const v = (value ?? "").trim();
  if (!v) return null;

  // Detect parenthesized negatives e.g. "($12.50)"
  const negative = /^\(.*\)$/.test(v) || v.trim().startsWith("-");

  // Strip currency symbols, thousands separators, parens, spaces.
  const cleaned = v.replace(/[(),$£€\s]/g, "").replace(/^-/, "");
  if (cleaned === "" || isNaN(Number(cleaned))) return null;

  const cents = Math.round(parseFloat(cleaned) * 100);
  return negative ? -cents : cents;
}

/** Normalize a phone number to E.164-ish digits, or null. Defaults to US (+1). */
export function toPhone(value: string, defaultCountry = "1"): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;

  const hasPlus = v.trim().startsWith("+");
  const digits = v.replace(/\D/g, "");
  if (digits.length < 7) return null; // too short to be a real number

  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

/** Lowercase + trim (used for emails, dedupe keys). */
export function toLowerTrim(value: string): string {
  return (value ?? "").trim().toLowerCase();
}

/** Split a delimited string into an array of tags. */
export function splitTags(value: string): string[] {
  return (value ?? "")
    .split(/[;,|]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Coerce common truthy/falsy export strings → boolean. */
export function toBoolean(value: string): boolean {
  return /^(true|yes|y|1|active|enabled)$/i.test((value ?? "").trim());
}

export type TransformFn = (value: string) => unknown;

/** Registry keyed by the names used in import_field_mappings.transform_function. */
export const TRANSFORMS: Record<string, TransformFn> = {
  to_date: toDate,
  to_cents: toCents,
  to_phone: (v) => toPhone(v),
  to_lower: toLowerTrim,
  to_tags: splitTags,
  to_boolean: toBoolean,
};

/** Apply a named transform; unknown names pass the value through trimmed. */
export function applyTransform(name: string | null | undefined, value: string): unknown {
  if (!name) return (value ?? "").trim();
  const fn = TRANSFORMS[name];
  return fn ? fn(value) : (value ?? "").trim();
}
