import { Capacitor } from "@capacitor/core";
import { isNativeApp, nativeApp } from "@/lib/native/platform";

/** Camera scanning lives in the Tandava Studio app only (camera permission is declared there). */
export const canScanPasses = () => nativeApp === "studio" && isNativeApp();

export type ScanOutcome = { kind: "code"; value: string } | { kind: "cancelled" } | { kind: "error"; message: string };

/** Opens the native full-screen QR scanner once. Loaded lazily so the web bundle never pulls it in. */
export async function scanOnce(): Promise<ScanOutcome> {
  if (!canScanPasses()) return { kind: "error", message: "Scanning works in the Tandava Studio app." };
  try {
    const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import("@capacitor/barcode-scanner");
    const res = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      scanInstructions: "Point at the member's check-in pass",
      cancelButtonAccessibilityLabel: "Stop scanning",
      torchButtonOnAccessibilityLabel: "Turn flashlight off",
      torchButtonOffAccessibilityLabel: "Turn flashlight on",
    });
    const value = res?.ScanResult ?? "";
    return value ? { kind: "code", value } : { kind: "cancelled" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // The plugin rejects when the person closes the scanner.
    if (/cancel/i.test(message)) return { kind: "cancelled" };
    if (/permission|denied|authori/i.test(message)) return { kind: "error", message: "Camera access is off. Turn it on in Settings > Tandava Studio > Camera." };
    return { kind: "error", message: "The scanner could not start. Use the roster instead." };
  }
}

/** Success and failure taps the front desk can feel without looking at the screen. */
export async function scanFeedback(tone: "success" | "warning" | "error"): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: tone === "success" ? NotificationType.Success : tone === "warning" ? NotificationType.Warning : NotificationType.Error });
  } catch { /* haptics are a nicety; never block check-in on them */ }
}
