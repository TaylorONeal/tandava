import { describe, it, expect } from "vitest";
import { parseCsv, tokenizeCsv } from "./csv";
import { toDate, toCents, toPhone, splitTags, toBoolean, applyTransform } from "./transforms";
import { autoMatchColumns, validateClientRows, type TargetField } from "./mapping";

describe("csv parser", () => {
  it("parses headers and rows", () => {
    const { headers, rows } = parseCsv("a,b,c\n1,2,3\n4,5,6");
    expect(headers).toEqual(["a", "b", "c"]);
    expect(rows).toEqual([
      { a: "1", b: "2", c: "3" },
      { a: "4", b: "5", c: "6" },
    ]);
  });

  it("handles quoted fields with embedded commas", () => {
    const { rows } = parseCsv('name,note\n"Doe, Jane","loves, yoga"');
    expect(rows[0]).toEqual({ name: "Doe, Jane", note: "loves, yoga" });
  });

  it("handles escaped quotes", () => {
    const { rows } = parseCsv('q\n"she said ""hi"""');
    expect(rows[0].q).toBe('she said "hi"');
  });

  it("handles CRLF line endings and a BOM", () => {
    const matrix = tokenizeCsv("﻿a,b\r\n1,2\r\n");
    expect(matrix).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("ignores blank trailing lines", () => {
    const { rows } = parseCsv("a\n1\n\n");
    expect(rows).toHaveLength(1);
  });
});

describe("transforms", () => {
  it("toDate parses US and ISO formats", () => {
    expect(toDate("03/15/1990")).toBe("1990-03-15");
    expect(toDate("2024-07-22")).toBe("2024-07-22");
    expect(toDate("1/2/2020")).toBe("2020-01-02");
    expect(toDate("")).toBeNull();
    expect(toDate("not a date")).toBeNull();
  });

  it("toCents parses currency strings", () => {
    expect(toCents("$25.00")).toBe(2500);
    expect(toCents("1,250.50")).toBe(125050);
    expect(toCents("($12.50)")).toBe(-1250);
    expect(toCents("")).toBeNull();
    expect(toCents("free")).toBeNull();
  });

  it("toPhone normalizes US numbers", () => {
    expect(toPhone("415-555-0101")).toBe("+14155550101");
    expect(toPhone("(415) 555 0102")).toBe("+14155550102");
    expect(toPhone("+44 20 7946 0958")).toBe("+442079460958");
    expect(toPhone("123")).toBeNull();
  });

  it("splitTags and toBoolean", () => {
    expect(splitTags("vip; prenatal, injury")).toEqual(["vip", "prenatal", "injury"]);
    expect(toBoolean("Yes")).toBe(true);
    expect(toBoolean("0")).toBe(false);
  });

  it("applyTransform dispatches by name and passes through unknowns", () => {
    expect(applyTransform("to_cents", "$10")).toBe(1000);
    expect(applyTransform(null, "  hi ")).toBe("hi");
    expect(applyTransform("nonexistent", " x ")).toBe("x");
  });
});

const CLIENT_TARGETS: TargetField[] = [
  { value: "first_name", label: "First Name", required: true, aliases: ["FirstName", "given name"] },
  { value: "last_name", label: "Last Name", required: true, aliases: ["LastName", "surname"] },
  { value: "email", label: "Email", required: true, aliases: ["email address"] },
  { value: "phone", label: "Phone", aliases: ["Mobile Phone", "cell"] },
];

describe("autoMatchColumns", () => {
  it("matches by label, value, and alias (case/space-insensitive)", () => {
    const headers = ["First Name", "LastName", "Email Address", "Mobile Phone", "Client ID"];
    const rows = [{ "First Name": "Mia", LastName: "Tanaka", "Email Address": "mia@ex.com", "Mobile Phone": "415-555-0101", "Client ID": "MB1" }];
    const matches = autoMatchColumns(headers, rows, CLIENT_TARGETS);

    expect(matches.find((m) => m.sourceColumn === "First Name")?.targetField).toBe("first_name");
    expect(matches.find((m) => m.sourceColumn === "LastName")?.targetField).toBe("last_name");
    expect(matches.find((m) => m.sourceColumn === "Email Address")?.targetField).toBe("email");
    expect(matches.find((m) => m.sourceColumn === "Mobile Phone")?.targetField).toBe("phone");
    // Unknown column is left unmapped
    expect(matches.find((m) => m.sourceColumn === "Client ID")?.targetField).toBe("");
  });

  it("does not double-assign the same target to two columns", () => {
    const headers = ["Email", "Email Address"];
    const rows = [{ Email: "a@ex.com", "Email Address": "b@ex.com" }];
    const matches = autoMatchColumns(headers, rows, CLIENT_TARGETS);
    const mappedToEmail = matches.filter((m) => m.targetField === "email");
    expect(mappedToEmail).toHaveLength(1);
  });
});

describe("validateClientRows", () => {
  const mappings = autoMatchColumns(
    ["First Name", "Last Name", "Email", "Phone"],
    [],
    CLIENT_TARGETS,
  );

  it("flags missing required fields and invalid emails, and dedupes by email", () => {
    const rows = [
      { "First Name": "Mia", "Last Name": "Tanaka", Email: "mia@ex.com", Phone: "415-555-0101" },
      { "First Name": "", "Last Name": "Rivera", Email: "alex@ex.com", Phone: "" }, // missing first name
      { "First Name": "Sam", "Last Name": "Lee", Email: "not-an-email", Phone: "" }, // bad email
      { "First Name": "Mia", "Last Name": "Tanaka", Email: "MIA@ex.com", Phone: "" }, // dup (case-insensitive)
      { "First Name": "Jo", "Last Name": "Park", Email: "jo@ex.com", Phone: "" },
    ];
    const result = validateClientRows(rows, mappings);

    expect(result.total).toBe(5);
    expect(result.valid).toBe(2); // Mia + Jo
    expect(result.duplicates).toBe(1);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].row).toBe(2);
    expect(result.records.map((r) => r.email)).toEqual(["mia@ex.com", "jo@ex.com"]);
  });
});
