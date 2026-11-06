// Writes the four QR codes for the Tandava Studio App Review notes.
// Passes 1 to 3 match the fixed booking ids in supabase/review/studio-review-seed.sql.
// Pass 4 is deliberately not a Tandava pass. A pass is an identifier, not a credential:
// only staff of the synthetic review studio can check it in.
//   node scripts/review/studio-review-passes.mjs
// Then build the PDF:  python3 scripts/review/studio-review-pdf.py
import QRCode from 'qrcode';
const out = 'docs/app-store/review';
const passes = [
  ['1', 'tandava:checkin:v1:f5a1d000-0000-4000-8000-0000000000e1'],
  ['2', 'tandava:checkin:v1:f5a1d000-0000-4000-8000-0000000000e2'],
  ['3', 'tandava:checkin:v1:f5a1d000-0000-4000-8000-0000000000e3'],
  ['4', 'https://tandavastudio.com/'],
];
for (const [n, text] of passes) {
  await QRCode.toFile(`${out}/qr-${n}.png`, text, { width: 600, margin: 2, errorCorrectionLevel: 'M' });
  console.log(`qr-${n}.png  ${text}`);
}
