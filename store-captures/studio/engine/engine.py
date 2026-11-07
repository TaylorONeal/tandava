"""Bold store screenshot engine (Oct 13 2026).
One layout spec per frame, rendered with headless Chrome. Real device captures only: screens are
cropped, framed and enlarged, never redrawn. Play = 1080x1920 from Pixel captures.
Run: python3 engine.py <app> [frame ...]   -> out/<app>/play-0N-1080x1920.png + out/<app>/contact-play.jpg
"""
import subprocess, sys, pathlib, importlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
import os
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800'
         '&family=Instrument+Serif:ital@0;1&family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,800'
         '&family=Archivo:wdth,wght@62..125,500;62..125,700;62..125,900&family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,500'
         '&family=IBM+Plex+Mono:wght@500;600&display=block" rel="stylesheet">')
SW, SH = 1440, 3040   # Pixel 4 XL capture size

BASE = '''*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{position:relative;-webkit-font-smoothing:antialiased;font-family:'Bricolage Grotesque',sans-serif}
.abs{position:absolute}
.phone{position:absolute;background:#0a0a0c;border-radius:74px;padding:15px;
  box-shadow:0 60px 120px rgba(0,0,0,.45),0 0 0 3px rgba(255,255,255,.10) inset,0 0 0 2px rgba(0,0,0,.6)}
.phone .scr{position:relative;width:100%;height:100%;border-radius:60px;overflow:hidden;background:#000}
.phone .scr img{width:100%;display:block}
.phone .cam{position:absolute;left:50%;top:34px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:#050506;
  box-shadow:0 0 0 3px rgba(255,255,255,.06);z-index:3}
.pop{position:absolute;overflow:hidden;border-radius:38px;background:#000}
.pop img{position:absolute;left:0;top:0;display:block;max-width:none}
.stk{position:absolute;display:inline-block;font-weight:800;white-space:nowrap;border-radius:999px;line-height:1}
'''

def phone(src, w, left, top, rot=0, extra=''):
    """Pixel-style frame around a full capture. w = outer width in px."""
    h = round((w - 30) * SH / SW + 30)
    return (f'<div class="phone" style="width:{w}px;height:{h}px;left:{left}px;top:{top}px;transform:{rot};{extra}">'
            f'<div class="cam"></div><div class="scr"><img src="{src}"></div></div>')

def pop(src, box, w, left, top, rot=0, ring='#fff', ringw=8, radius=38, shadow='0 34px 80px rgba(0,0,0,.5)', z=5):
    """Enlarged crop of a real capture. box = (x0,y0,x1,y1) in capture pixels; w = output width."""
    x0, y0, x1, y1 = box
    s = w / (x1 - x0); h = round((y1 - y0) * s)
    return (f'<div class="pop" style="width:{w}px;height:{h}px;left:{left}px;top:{top}px;transform:rotate({rot}deg);'
            f'border-radius:{radius}px;box-shadow:0 0 0 {ringw}px {ring},{shadow};z-index:{z}">'
            f'<img src="{src}" style="width:{SW*s:.1f}px;left:{-x0*s:.1f}px;top:{-y0*s:.1f}px"></div>')

def stk(text, left, top, bg, fg, size=40, rot=-6, pad='16px 30px', z=8, extra=''):
    return (f'<div class="stk" style="left:{left}px;top:{top}px;background:{bg};color:{fg};font-size:{size}px;'
            f'padding:{pad};transform:rotate({rot}deg);z-index:{z};{extra}">{text}</div>')

def burst(left, top, size, fill, text='', fg='#000', rot=-12, fs=34, z=8):
    """Starburst sticker."""
    import math
    pts = []
    for i in range(32):
        r = 50 if i % 2 == 0 else 41
        a = math.pi * 2 * i / 32
        pts.append(f'{50 + r*math.cos(a):.1f},{50 + r*math.sin(a):.1f}')
    return (f'<div class="abs" style="left:{left}px;top:{top}px;width:{size}px;height:{size}px;transform:rotate({rot}deg);z-index:{z}">'
            f'<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="{" ".join(pts)}" fill="{fill}"/></svg>'
            f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;'
            f'font-weight:800;font-size:{fs}px;line-height:.95;color:{fg};text-transform:uppercase;letter-spacing:-.01em">{text}</div></div>')

def spark(left, top, size, fill, rot=0, z=4):
    """Four-point sparkle."""
    return (f'<svg class="abs" style="left:{left}px;top:{top}px;transform:rotate({rot}deg);z-index:{z}" width="{size}" height="{size}" viewBox="0 0 100 100">'
            f'<path d="M50 0 C54 34 66 46 100 50 C66 54 54 66 50 100 C46 66 34 54 0 50 C34 46 46 34 50 0Z" fill="{fill}"/></svg>')

def squiggle(left, top, w, color, rot=0, sw=10, z=4):
    return (f'<svg class="abs" style="left:{left}px;top:{top}px;transform:rotate({rot}deg);z-index:{z}" width="{w}" height="{w*0.22:.0f}" viewBox="0 0 400 88" fill="none">'
            f'<path d="M8 60 C40 8 72 8 104 44 S168 80 200 44 S264 8 296 44 S360 80 392 30" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/></svg>')

def arrow(left, top, w, color, rot=0, sw=9, z=9):
    """Hand-drawn curved arrow."""
    return (f'<svg class="abs" style="left:{left}px;top:{top}px;transform:rotate({rot}deg);z-index:{z}" width="{w}" height="{w*0.6:.0f}" viewBox="0 0 200 120" fill="none">'
            f'<path d="M10 20 C70 0 150 30 172 96" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'
            f'<path d="M140 78 L174 102 L186 62" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>')

def render(app, name, css, body):
    out = HERE / 'out' / app; out.mkdir(parents=True, exist_ok=True)
    f = HERE / f'_{app}-{name}.html'
    f.write_text(f'<!doctype html><html><head><meta charset="utf-8">{FONTS}<style>{BASE}{css}</style></head><body>{body}</body></html>')
    png = out / f'{name}-1080x1920.png'
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    '--window-size=1080,1920', '--virtual-time-budget=9000', f'--screenshot={png}', f.as_uri()],
                   check=True, capture_output=True)
    Image.open(png).convert('RGB').save(png)   # flatten: Play rejects alpha
    return png

def contact(app, pngs):
    """Two views: one row at store-strip size, and a 4-up review sheet."""
    ims = [Image.open(p).convert('RGB') for p in pngs]
    row = Image.new('RGB', (len(ims) * 444 + 12, 792), '#0d0d10')
    for i, im in enumerate(ims): row.paste(im.resize((432, 768), Image.LANCZOS), (12 + i * 444, 12))
    p = HERE / 'out' / app / 'contact-play.jpg'; row.save(p, quality=86)
    row.resize((row.width * 3 // 10, row.height * 3 // 10), Image.LANCZOS).save(HERE / 'out' / app / 'contact-play-30pct.jpg', quality=88)
    cols = 4; rows = -(-len(ims) // cols)
    big = Image.new('RGB', (cols * 560 + 20, rows * 980 + 20), '#0d0d10')
    for i, im in enumerate(ims): big.paste(im.resize((540, 960), Image.LANCZOS), (20 + (i % cols) * 560, 20 + (i // cols) * 980))
    big.save(HERE / 'out' / app / 'review-sheet.jpg', quality=88)
    return p

if __name__ == '__main__':
    app = sys.argv[1]; want = sys.argv[2:]
    mod = importlib.import_module(f'set_{app}')
    pngs = []
    for name, css, body in mod.frames():
        if want and name not in want:
            pngs.append(HERE / 'out' / app / f'{name}-1080x1920.png'); continue
        pngs.append(render(app, name, mod.CSS + css, body)); print('wrote', name)
    print(contact(app, [p for p in pngs if p.exists()]))
