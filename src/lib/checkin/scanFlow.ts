import type { DataResult, PassScan } from "@/lib/backend/types";
import { describeScan, readPass } from "./pass";
import type { ScanOutcome } from "@/lib/native/scanner";

export type ScanView = { title: string; detail: string; tone: "success" | "warning" | "error"; recorded: boolean };

function classLine(scan: PassScan): string | null {
  if (!scan.offering_name || !scan.starts_at) return null;
  try {
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: scan.studio_timezone || undefined }).format(new Date(scan.starts_at));
    return `${scan.offering_name} · ${time}`;
  } catch {
    return scan.offering_name;
  }
}

/**
 * One scan, start to finish. Returns null when the person closed the scanner.
 * Never claims attendance unless the server answered checked_in.
 */
export async function runScan(
  scan: () => Promise<ScanOutcome>,
  checkIn: (pass: string) => Promise<DataResult<PassScan>>,
): Promise<ScanView | null> {
  const outcome = await scan();
  if (outcome.kind === "cancelled") return null;
  if (outcome.kind === "error") return { title: "Scanner unavailable", detail: outcome.message, tone: "error", recorded: false };
  const pass = readPass(outcome.value);
  if (!pass) return { ...describeScan("invalid_pass", null), recorded: false };
  let res: DataResult<PassScan>;
  try {
    res = await checkIn(pass);
  } catch {
    res = { data: null, error: { message: "No connection. Try again, or use the roster." } };
  }
  if (res.error || !res.data) return { title: "Not recorded", detail: res.error?.message ?? "Try again, or use the roster.", tone: "error", recorded: false };
  const view = describeScan(res.data.result, res.data.student_name);
  const line = classLine(res.data);
  return { ...view, detail: line ? `${line}. ${view.detail}` : view.detail, recorded: res.data.result === "checked_in" };
}
