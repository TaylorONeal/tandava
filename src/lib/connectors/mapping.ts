/**
 * Column auto-matching, validation, and deduplication for the importer.
 *
 * Turns a raw parsed CSV into a mapped, validated, de-duplicated dataset ready
 * to hand to the backend for insertion.
 */

import { toLowerTrim } from "./transforms";

/** A target field the importer can map a CSV column onto. */
export interface TargetField {
  value: string;
  label: string;
  required?: boolean;
  /** Header aliases (normalized) that should auto-map to this field. */
  aliases?: string[];
}

export interface ColumnMatch {
  sourceColumn: string;
  targetField: string;
  sampleValues: string[];
  isRequired: boolean;
  autoMatched: boolean;
}

/** Normalize a header for fuzzy comparison: lowercase, strip non-alphanumerics. */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Auto-match CSV headers to target fields by normalized name + alias list.
 * Returns one ColumnMatch per CSV header (unmatched → targetField "").
 */
export function autoMatchColumns(
  headers: string[],
  rows: Record<string, string>[],
  targets: TargetField[],
): ColumnMatch[] {
  // Build a lookup of normalized alias/label/value → target value.
  const lookup = new Map<string, TargetField>();
  for (const t of targets) {
    if (!t.value) continue;
    lookup.set(normalizeHeader(t.value), t);
    lookup.set(normalizeHeader(t.label), t);
    for (const alias of t.aliases ?? []) {
      lookup.set(normalizeHeader(alias), t);
    }
  }

  const taken = new Set<string>();

  return headers.map((header) => {
    const norm = normalizeHeader(header);
    const match = lookup.get(norm);
    const sampleValues = rows
      .slice(0, 3)
      .map((r) => r[header] ?? "")
      .filter(Boolean);

    if (match && !taken.has(match.value)) {
      taken.add(match.value);
      return {
        sourceColumn: header,
        targetField: match.value,
        sampleValues,
        isRequired: Boolean(match.required),
        autoMatched: true,
      };
    }

    return {
      sourceColumn: header,
      targetField: "",
      sampleValues,
      isRequired: false,
      autoMatched: false,
    };
  });
}

export interface RowError {
  row: number; // 1-based, matching the CSV body (excludes header)
  message: string;
}

export interface ValidationResult {
  total: number;
  valid: number;
  errors: RowError[];
  duplicates: number;
  /** Validated, mapped, de-duplicated records ready for insert. */
  records: Record<string, string>[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate + dedupe client rows against the chosen column mapping.
 *
 * Required-field presence, email format, and duplicate-by-email are enforced —
 * mirroring what the wizard's preview and result screens report.
 */
export function validateClientRows(
  rows: Record<string, string>[],
  mappings: ColumnMatch[],
): ValidationResult {
  const mapped = mappings.filter((m) => m.targetField);
  const requiredFields = mapped.filter((m) => m.isRequired).map((m) => m.targetField);
  const emailCol = mapped.find((m) => m.targetField === "email")?.sourceColumn;

  const errors: RowError[] = [];
  const records: Record<string, string>[] = [];
  const seenEmails = new Set<string>();
  let duplicates = 0;

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const record: Record<string, string> = {};
    for (const m of mapped) {
      record[m.targetField] = row[m.sourceColumn] ?? "";
    }

    // Required fields present?
    const missing = requiredFields.filter((f) => !record[f]?.trim());
    if (missing.length > 0) {
      errors.push({ row: rowNum, message: `Missing required field: ${missing.join(", ")}` });
      return;
    }

    // Email format + dedupe.
    if (emailCol) {
      const email = toLowerTrim(record.email);
      if (email && !EMAIL_RE.test(email)) {
        errors.push({ row: rowNum, message: `Invalid email format: '${record.email}'` });
        return;
      }
      if (email && seenEmails.has(email)) {
        duplicates++;
        return; // skip duplicate, not an error
      }
      if (email) seenEmails.add(email);
    }

    records.push(record);
  });

  return {
    total: rows.length,
    valid: records.length,
    errors,
    duplicates,
    records,
  };
}
