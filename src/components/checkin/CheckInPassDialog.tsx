import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { passFor } from "@/lib/checkin/pass";

/** Real, scannable check-in pass for one booking. Shown from My Schedule. */
export function CheckInPassDialog({ bookingId, title, when, onClose }: {
  bookingId: string | null; title: string; when: string; onClose: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setSrc(null); setFailed(false);
    if (!bookingId) return;
    let live = true;
    QRCode.toDataURL(passFor(bookingId), { errorCorrectionLevel: "M", margin: 2, width: 640 })
      .then(url => { if (live) setSrc(url); })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [bookingId]);
  return (
    <Dialog open={Boolean(bookingId)} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Check-in pass</DialogTitle>
          <DialogDescription>{title} · {when}. Show this at the front desk. Check-in opens 60 minutes before class.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center rounded-xl bg-white p-4">
          {src ? <img src={src} alt={`Check-in QR code for ${title}`} className="h-64 w-64" data-testid="checkin-pass-qr" />
            : failed ? <p role="alert" className="text-sm text-destructive">The pass could not be drawn. Your name on the roster still works.</p>
            : <p role="status" className="text-sm text-muted-foreground">Drawing your pass…</p>}
        </div>
        <p className="text-center text-xs text-muted-foreground">Turn your screen brightness up if the scan is slow.</p>
      </DialogContent>
    </Dialog>
  );
}
