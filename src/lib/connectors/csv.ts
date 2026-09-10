/**
 * CSV parsing for the data importer.
 *
 * A small, dependency-free RFC 4180-style parser that handles quoted fields,
 * escaped quotes (""), embedded commas, and CRLF/LF line endings — the things
 * real Mindbody/Momence/Arketa exports actually contain.
 */

export interface ParsedCsv {
  headers: string[];
  /** Each row as an object keyed by header. */
  rows: Record<string, string>[];
  /** Raw row arrays (header order preserved), excluding the header line. */
  matrix: string[][];
}

/** Tokenize raw CSV text into a matrix of rows × cells. */
export function tokenizeCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Strip a leading UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // skip the escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      // Handle CRLF: skip the \n that follows a \r.
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  // Flush trailing field/row (file may not end in a newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-empty trailing rows.
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/** Parse CSV text into headers + row objects. */
export function parseCsv(text: string): ParsedCsv {
  const matrix = tokenizeCsv(text);
  if (matrix.length === 0) {
    return { headers: [], rows: [], matrix: [] };
  }

  const headers = matrix[0].map((h) => h.trim());
  const body = matrix.slice(1);
  const rows = body.map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = (cells[idx] ?? "").trim();
    });
    return obj;
  });

  return { headers, rows, matrix: body };
}

/** Read and parse a File (browser) into a ParsedCsv. */
export async function parseCsvFile(file: File): Promise<ParsedCsv> {
  const text = await file.text();
  return parseCsv(text);
}
