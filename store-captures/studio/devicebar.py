"""Put browser viewport captures into full device screens for the store engines.
iOS:  440x860 pt page at 3x (1320x2580) -> 1320x2868 (iPhone 17 Pro Max, 62 pt status bar, 34 pt home area).
Play: 360x616 dp page at 3x (1080x1848) -> 1080x1920 (24 dp status bar).
The status bar is the standard 9:41 clean bar; the page itself is never edited.
usage: python3 devicebar.py ios|play <in_dir> <out_dir>
"""
import sys, pathlib
from PIL import Image, ImageDraw, ImageFont

BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def edge_color(im, y):
    row = [im.getpixel((x, y)) for x in range(0, im.width, max(1, im.width // 40))]
    row.sort(key=sum)
    return row[len(row) // 2][:3]

def ink(bg):
    return (0, 0, 0) if sum(bg) > 382 else (255, 255, 255)

def wifi(d, wx, wy, s, fg, bg):
    for r, w in ((13, 2.6), (8.6, 2.6)):
        d.arc([wx - r * s, wy - r * s, wx + r * s, wy + r * s], 225, 315, fill=fg, width=int(w * s))
    r = 4.2
    d.pieslice([wx - r * s, wy - r * s, wx + r * s, wy + r * s], 225, 315, fill=fg)

def bar(kind, src, dst):
    im = Image.open(src).convert('RGB')
    if kind == 'ios':
        s, W, H, top, bottom, clock_x, clock_size, right = 3, 1320, 2868, 186, 102, 108, 17, 1320 - 96
    else:
        s, W, H, top, bottom, clock_x, clock_size, right = 3, 1080, 1920, 72, 0, 54, 14, 1080 - 48
    page_h = H - top - bottom
    if im.size != (W, page_h):
        im = im.resize((W, page_h), Image.LANCZOS) if abs(im.height - page_h) > 3 else im.crop((0, 0, W, page_h))
    tb, bb = edge_color(im, 2), edge_color(im, im.height - 3)
    out = Image.new('RGB', (W, H), tb)
    out.paste(im, (0, top))
    if bottom:
        out.paste(Image.new('RGB', (W, bottom), bb), (0, H - bottom))
    d = ImageDraw.Draw(out)
    fg = ink(tb)
    f = ImageFont.truetype(BOLD, clock_size * s)
    cy = (top // 2 + 6) if kind == 'ios' else top // 2
    d.text((clock_x, cy), '9:41', font=f, fill=fg, anchor='lm')
    # battery
    bw, bh = (27 * s, 13 * s) if kind == 'ios' else (11 * s, 18 * s)
    if kind == 'ios':
        x1 = right; x0 = x1 - bw
        d.rounded_rectangle([x0, cy - bh / 2, x1, cy + bh / 2], radius=4 * s, outline=fg, width=4)
        d.rounded_rectangle([x0 + 7, cy - bh / 2 + 7, x1 - 7, cy + bh / 2 - 7], radius=6, fill=fg)
        d.rounded_rectangle([x1 + 4, cy - 7, x1 + 9, cy + 7], radius=3, fill=fg)
        wifi(d, x0 - 15 * s, cy + 5 * s, s, fg, tb)
        sx = x0 - 52 * s
        for i, h in enumerate((4, 6.5, 9, 11.5)):
            bx = sx + i * 4.6 * s
            d.rounded_rectangle([bx, cy + 5.5 * s - h * s, bx + 3 * s, cy + 5.5 * s], radius=2, fill=fg)
        hb = ink(bb)
        d.rounded_rectangle([W / 2 - 67 * s, H - 13 * s, W / 2 + 67 * s, H - 8 * s], radius=3 * s, fill=hb)
    else:
        x1 = right; x0 = x1 - bw
        d.rounded_rectangle([x0, cy - bh / 2, x1, cy + bh / 2], radius=2 * s, fill=fg)
        d.rectangle([x0 + bw / 2 - 2 * s, cy - bh / 2 - 2 * s, x0 + bw / 2 + 2 * s, cy - bh / 2], fill=fg)
        d.polygon([(x0 - 6 * s, cy + 8 * s), (x0 - 22 * s, cy + 8 * s), (x0 - 6 * s, cy - 8 * s)], fill=fg)
        wifi(d, x0 - 36 * s, cy + 7 * s, s * 1.1, fg, tb)
    out.save(dst)

if __name__ == '__main__':
    kind, src, dst = sys.argv[1], pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])
    dst.mkdir(parents=True, exist_ok=True)
    for p in sorted(src.glob('*.png')):
        bar(kind, p, dst / p.name); print('bar', kind, p.name)
