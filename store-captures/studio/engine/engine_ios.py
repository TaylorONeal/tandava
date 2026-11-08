"""App Store screenshot engine (Oct 13 2026). Same rules as engine.py: real captures only, cropped, framed
and enlarged, never redrawn. Canvas 1320x2868 (iPhone 6.9"), captures from the iPhone 17 Pro Max simulator
(1320x2868) or a real iPhone. Never use Android captures here.
Run: python3 engine_ios.py <app> [frame ...]  -> out/<app>/ios-0N-1320x2868.png, contact-ios.jpg, review-sheet-ios.jpg
"""
import subprocess, sys, pathlib, importlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
import os
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
W, H = 1320, 2868        # canvas
SW, SH = 1320, 2868      # capture size
FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,900;1,9..144,600;1,9..144,900'
         '&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Caveat:wght@700'
         '&family=IBM+Plex+Mono:wght@500;600&display=block" rel="stylesheet">')

BASE = f'''*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{W}px;height:{H}px;overflow:hidden}}
body{{position:relative;-webkit-font-smoothing:antialiased;font-family:'Bricolage Grotesque',sans-serif}}
.abs{{position:absolute}}
.phone{{position:absolute;background:#0b0b0d;border-radius:118px;padding:20px;z-index:3;
  box-shadow:0 70px 140px rgba(0,0,0,.42),0 0 0 4px rgba(255,255,255,.10) inset,0 0 0 2px rgba(0,0,0,.6)}}
.phone .scr{{position:relative;width:100%;height:100%;border-radius:100px;overflow:hidden;background:#000}}
.phone .scr img{{width:100%;display:block}}
.phone .isl{{position:absolute;left:50%;top:26px;width:27%;height:4.1%;transform:translateX(-50%);border-radius:999px;background:#050506;z-index:3}}
.pop{{position:absolute;overflow:hidden;background:#000}}
.pop img{{position:absolute;left:0;top:0;display:block;max-width:none}}
.stk{{position:absolute;display:inline-block;font-weight:800;white-space:nowrap;border-radius:999px;line-height:1}}
'''

def phone(src, w, left, top, rot=0, extra=''):
    """iPhone-style frame around a full capture. w = outer width in px. The island is drawn on the frame
    because simulator captures do not include it."""
    h = round((w - 40) * SH / SW + 40)
    sc = w / 1000
    return (f'<div class="phone" style="width:{w}px;height:{h}px;left:{left}px;top:{top}px;transform:rotate({rot}deg);'
            f'border-radius:{118*sc:.0f}px;padding:{20*sc:.0f}px;{extra}">'
            f'<div class="scr" style="border-radius:{100*sc:.0f}px"><div class="isl"></div><img src="{src}"></div></div>')

def pop(src, box, w, left, top, rot=0, ring='#fff', ringw=10, radius=30, shadow='0 40px 90px rgba(0,0,0,.42)', z=5):
    """Enlarged crop of a real capture. box = (x0,y0,x1,y1) in capture pixels; w = output width."""
    x0, y0, x1, y1 = box
    s = w / (x1 - x0); h = round((y1 - y0) * s)
    return (f'<div class="pop" style="width:{w}px;height:{h}px;left:{left}px;top:{top}px;transform:rotate({rot}deg);'
            f'border-radius:{radius}px;box-shadow:0 0 0 {ringw}px {ring},{shadow};z-index:{z}">'
            f'<img src="{src}" style="width:{SW*s:.1f}px;left:{-x0*s:.1f}px;top:{-y0*s:.1f}px"></div>'), h

def stk(text, left, top, bg, fg, size=48, rot=-6, pad='20px 36px', z=8, extra=''):
    return (f'<div class="stk" style="left:{left}px;top:{top}px;background:{bg};color:{fg};font-size:{size}px;'
            f'padding:{pad};transform:rotate({rot}deg);z-index:{z};{extra}">{text}</div>')

def spark(left, top, size, fill, rot=0, z=4):
    return (f'<svg class="abs" style="left:{left}px;top:{top}px;transform:rotate({rot}deg);z-index:{z}" width="{size}" height="{size}" viewBox="0 0 100 100">'
            f'<path d="M50 0 C54 34 66 46 100 50 C66 54 54 66 50 100 C46 66 34 54 0 50 C34 46 46 34 50 0Z" fill="{fill}"/></svg>')

def scribble(left, top, w, color, rot=0, sw=12, z=7):
    """Hand-drawn double underline."""
    return (f'<svg class="abs" style="left:{left}px;top:{top}px;transform:rotate({rot}deg);z-index:{z}" width="{w}" height="{w*0.12:.0f}" viewBox="0 0 500 60" fill="none">'
            f'<path d="M6 22 C120 6 300 4 494 18" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'
            f'<path d="M40 46 C170 34 330 32 470 44" stroke="{color}" stroke-width="{sw*0.75:.1f}" stroke-linecap="round"/></svg>')

def arrow(left, top, w, color, rot=0, sw=10, z=9):
    return (f'<svg class="abs" style="left:{left}px;top:{top}px;transform:rotate({rot}deg);z-index:{z}" width="{w}" height="{w*0.6:.0f}" viewBox="0 0 200 120" fill="none">'
            f'<path d="M10 20 C70 0 150 30 172 96" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'
            f'<path d="M140 78 L174 102 L186 62" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>')

def shoot(html, png, W, H, tries=3):
    """Headless Chrome screenshot. Chrome 155 on macOS writes the PNG in a few seconds and then hangs ~25 s in
    teardown ("Teardown watchdog expired", exit 2). Poll for a complete image of the right size, then kill Chrome
    ourselves. A private user-data-dir keeps overlapping renders from fighting over the profile lock."""
    import tempfile, time, shutil
    for i in range(tries):
        prof = tempfile.mkdtemp(prefix='shot-'); pathlib.Path(png).unlink(missing_ok=True)
        proc = subprocess.Popen([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                                 f'--user-data-dir={prof}', '--disable-crashpad', '--disable-breakpad', '--no-first-run',
                                 '--disable-extensions', '--disable-background-networking',
                                 f'--window-size={W},{H}', '--virtual-time-budget=9000',
                                 f'--screenshot={png}', pathlib.Path(html).resolve().as_uri()],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        ok = False; t0 = time.time()
        while time.time() - t0 < 90:
            if pathlib.Path(png).exists():
                try:
                    im = Image.open(png); im.load()
                    if im.size == (W, H): ok = True; break
                except Exception:
                    pass
            if proc.poll() is not None and not pathlib.Path(png).exists(): break
            time.sleep(0.4)
        time.sleep(0.6)
        if proc.poll() is None: proc.terminate()
        try: proc.wait(timeout=10)
        except Exception: proc.kill()
        shutil.rmtree(prof, ignore_errors=True)
        if ok: return
        time.sleep(2 + 2 * i)
    raise RuntimeError(f'chrome produced no complete image for {png} after {tries} tries')

def render(app, name, css, body):
    out = HERE / 'out' / app; out.mkdir(parents=True, exist_ok=True)
    f = HERE / f'_{app}-{name}.html'
    f.write_text(f'<!doctype html><html><head><meta charset="utf-8">{FONTS}<style>{BASE}{css}</style></head><body>{body}</body></html>')
    png = out / f'{name}-{W}x{H}.png'
    shoot(f, png, W, H)
    im = Image.open(png).convert('RGB')
    assert im.size == (W, H), im.size
    im.save(png)   # flatten: the stores reject alpha
    return png

def contact(app, pngs):
    ims = [Image.open(p).convert('RGB') for p in pngs]
    tw, th = 396, 860
    row = Image.new('RGB', (len(ims) * (tw + 12) + 12, th + 24), '#0d0d10')
    for i, im in enumerate(ims): row.paste(im.resize((tw, th), Image.LANCZOS), (12 + i * (tw + 12), 12))
    p = HERE / 'out' / app / 'contact-ios.jpg'; row.save(p, quality=86)
    row.resize((row.width * 3 // 10, row.height * 3 // 10), Image.LANCZOS).save(HERE / 'out' / app / 'contact-ios-30pct.jpg', quality=88)
    cols = 3; rows = -(-len(ims) // cols); cw, ch = 600, 1304
    big = Image.new('RGB', (cols * (cw + 20) + 20, rows * (ch + 20) + 20), '#0d0d10')
    for i, im in enumerate(ims): big.paste(im.resize((cw, ch), Image.LANCZOS), (20 + (i % cols) * (cw + 20), 20 + (i // cols) * (ch + 20)))
    big.save(HERE / 'out' / app / 'review-sheet-ios.jpg', quality=88)
    return p

if __name__ == '__main__':
    app = sys.argv[1]; want = sys.argv[2:]
    mod = importlib.import_module(f'set_{app}')
    pngs = []
    for name, css, body in mod.frames():
        if want and name not in want:
            pngs.append(HERE / 'out' / app / f'{name}-{W}x{H}.png'); continue
        pngs.append(render(app, name, mod.CSS + css, body)); print('wrote', name)
    print(contact(app, [p for p in pngs if p.exists()]))
