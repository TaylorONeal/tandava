"""Lays the four review QR codes on one US Letter page: docs/app-store/review/studio-review-passes.pdf."""
from PIL import Image, ImageDraw, ImageFont

DIR = "docs/app-store/review"
LABELS = {
    "1": "QR code 1: Avery Member One (Tandava pass)",
    "2": "QR code 2: Jordan Member Two (Tandava pass)",
    "3": "QR code 3: Quinn Member Three (Tandava pass)",
    "4": "QR code 4: not a Tandava pass",
}
W, H = 2550, 3300  # Letter at 300 dpi
page = Image.new("RGB", (W, H), "white")
draw = ImageDraw.Draw(page)
try:
    title = ImageFont.truetype("DejaVuSans-Bold.ttf", 64)
    body = ImageFont.truetype("DejaVuSans.ttf", 40)
except OSError:
    title = body = ImageFont.load_default()
draw.text((150, 120), "Tandava Studio: App Review check-in passes", font=title, fill="black")
draw.text((150, 220), "Synthetic review studio. Scan with the Scan passes screen after signing in as the Owner.", font=body, fill="black")
cells = [(150, 400), (1325, 400), (150, 1800), (1325, 1800)]
for (x, y), n in zip(cells, ["1", "2", "3", "4"]):
    qr = Image.open(f"{DIR}/qr-{n}.png").convert("RGB").resize((1000, 1000), Image.NEAREST)
    page.paste(qr, (x + 37, y))
    draw.text((x + 37, y + 1030), LABELS[n], font=body, fill="black")
page.save(f"{DIR}/studio-review-passes.pdf", "PDF", resolution=300)
print("wrote", f"{DIR}/studio-review-passes.pdf")
