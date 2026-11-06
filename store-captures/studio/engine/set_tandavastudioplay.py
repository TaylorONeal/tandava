"""Tandava Studio Google Play phone set, 7 frames at 1080x1920. Same studio-front-door language as
set_tandavastudio.py (iOS): ink, teal, lime, coral, paper, plum, giant lowercase Bricolage, slanted
highlighter band, camera-corner brackets, perforated wristband stickers.
Captures: raw/android/tandavastudio/<name>.png at 1080x1920 (360x640 dp at 3x)."""
import engine
engine.SW, engine.SH = 1080, 1920          # captures are 1080x1920, not Pixel 4 XL
from engine import phone, pop, spark

R = 'raw/android/tandavastudio/'
INK, TEAL, LIME, CORAL, PAPER, PLUM = '#0E0A12', '#3EE6D2', '#D7FF3F', '#FF6B8B', '#FFF8EE', '#2A1636'

CSS = f'''
.tag{{position:absolute;left:64px;top:84px;font:600 22px 'IBM Plex Mono',monospace;letter-spacing:.2em;text-transform:uppercase;z-index:6}}
.h{{position:absolute;left:52px;right:20px;top:138px;font-weight:800;font-size:150px;line-height:.86;letter-spacing:-.055em;z-index:6;white-space:nowrap}}
.h .band{{display:inline-block;padding:0 24px 12px 16px;margin-left:-12px;transform:rotate(-3deg);border-radius:10px}}
.sub{{position:absolute;left:64px;right:50px;font-weight:700;font-size:40px;line-height:1.12;letter-spacing:-.02em;z-index:6}}
.brk{{position:absolute;z-index:9;pointer-events:none}}
.brk i{{position:absolute;width:80px;height:80px;border-style:solid;border-color:var(--c)}}
.wb{{position:absolute;z-index:10;display:flex;align-items:center;gap:16px;height:82px;padding:0 38px;border-radius:16px;
  font:800 40px 'Bricolage Grotesque',sans-serif;letter-spacing:-.02em;white-space:nowrap;
  -webkit-mask:radial-gradient(circle at 0 50%,transparent 14px,#000 15px) left/51% 100% no-repeat,
               radial-gradient(circle at 100% 50%,transparent 14px,#000 15px) right/51% 100% no-repeat}}
.grid{{position:absolute;inset:0;z-index:0;background-image:linear-gradient(var(--g) 2px,transparent 2px),linear-gradient(90deg,var(--g) 2px,transparent 2px);background-size:80px 80px}}
'''

def head(l1, l2, sub, fg, band_bg, band_fg, size=150, tag='Tandava Studio'):
    sub_top = 138 + int(2 * size * .86) + 46
    return (f'<div class="tag" style="color:{fg};opacity:.7">{tag}</div>'
            f'<div class="h" style="color:{fg};font-size:{size}px">{l1}<br>'
            f'<span class="band" style="background:{band_bg};color:{band_fg}">{l2}</span></div>'
            f'<div class="sub" style="color:{fg};top:{sub_top}px">{sub}</div>')

def brackets(left, top, w, h, color, inset=-24, t=10):
    s = f'--c:{color};'
    return (f'<div class="brk" style="left:{left + inset}px;top:{top + inset}px;width:{w - 2 * inset}px;height:{h - 2 * inset}px;{s}">'
            f'<i style="left:0;top:0;border-width:{t}px 0 0 {t}px;border-radius:24px 0 0 0"></i>'
            f'<i style="right:0;top:0;border-width:{t}px {t}px 0 0;border-radius:0 24px 0 0"></i>'
            f'<i style="left:0;bottom:0;border-width:0 0 {t}px {t}px;border-radius:0 0 0 24px"></i>'
            f'<i style="right:0;bottom:0;border-width:0 {t}px {t}px 0;border-radius:0 0 24px 0"></i></div>')

def scanpop(src, box, w, left, top, rot, color, ring=INK, z=6):
    html = pop(src, box, w, left, top, rot=rot, ring=ring, ringw=8, radius=26, z=z)
    h = round((box[3] - box[1]) * w / (box[2] - box[0]))
    return html + brackets(left, top, w, h, color)

def band(text, left, top, bg, fg, rot=-6):
    return (f'<div class="wb" style="left:{left}px;top:{top}px;background:{bg};color:{fg};transform:rotate({rot}deg)">{text}</div>')

def frames():
    F = []
    F.append(('phone-01', f'body{{background:{INK}}}',
        f'<div class="grid" style="--g:rgba(62,230,210,.07)"></div>'
        + head('scan them', 'in.', 'Check members in at the door with your camera.', PAPER, LIME, INK, 168)
        + phone(R+'member-pass.png', 430, 40, 780, 'rotate(-9deg)', 'opacity:.96')
        + phone(R+'01-scan-success.png', 540, 470, 700, 'rotate(4deg)')
        + scanpop(R+'01-scan-success.png', (40, 590, 1040, 1280), 760, 140, 1330, -3, LIME)
        + band('&#10003; checked in', 560, 630, TEAL, INK, 6)
        + spark(940, 90, 90, CORAL, 10)))
    F.append(('phone-02', f'body{{background:{TEAL}}}',
        f'<div class="grid" style="--g:rgba(14,10,18,.06)"></div>'
        + head('front desk', 'to go.', 'Your studio, today, on one screen.', INK, INK, LIME)
        + phone(R+'02-dashboard.png', 560, 200, 700, 'rotate(-3deg)')
        + scanpop(R+'02-dashboard.png', (20, 330, 1060, 1080), 820, 130, 1300, 3, CORAL)
        + spark(930, 110, 90, PAPER, 8)))
    F.append(('phone-03', f'body{{background:{LIME}}}',
        f'<div class="grid" style="--g:rgba(14,10,18,.06)"></div>'
        + head('tap.', 'checked in.', 'No pass? The roster works too.', INK, INK, LIME, 140)
        + phone(R+'03-roster.png', 560, 300, 680, 'rotate(5deg)')
        + scanpop(R+'03-roster.png', (20, 660, 1060, 1035), 820, 70, 1440, -4, INK, ring=PAPER)))
    F.append(('phone-04', f'body{{background:{PLUM}}}',
        f'<div class="grid" style="--g:rgba(215,255,63,.06)"></div>'
        + head('teachers', 'get theirs.', 'Assigned classes and rosters, nothing else.', PAPER, CORAL, INK)
        + phone(R+'04-teach.png', 560, 200, 700, 'rotate(-4deg)')
        + scanpop(R+'04-teach.png', (20, 800, 1060, 1500), 820, 140, 1330, 3, TEAL)
        + spark(60, 700, 70, LIME, -10)))
    F.append(('phone-05', f'body{{background:{PAPER}}}',
        f'<div class="grid" style="--g:rgba(42,22,54,.06)"></div>'
        + head('your week,', 'your way.', 'Add classes, move times, cancel when needed.', INK, TEAL, INK)
        + phone(R+'05-schedule.png', 560, 330, 690, 'rotate(4deg)')
        + scanpop(R+'05-schedule.png', (20, 740, 1060, 1500), 800, 60, 1310, -3, CORAL)))
    F.append(('phone-06', f'body{{background:{CORAL}}}',
        f'<div class="grid" style="--g:rgba(14,10,18,.07)"></div>'
        + head('set your', 'prices.', 'Drop-ins, class packs and memberships.', INK, INK, PAPER)
        + phone(R+'06-offerings.png', 560, 200, 700, 'rotate(-4deg)')
        + scanpop(R+'06-offerings.png', (10, 930, 1070, 1520), 820, 130, 1400, 3, LIME)
        + spark(930, 100, 90, LIME, 12)))
    F.append(('phone-07', f'body{{background:{INK}}}',
        f'<div class="grid" style="--g:rgba(255,107,139,.07)"></div>'
        + head('share the', 'link.', 'Members book from your page. You see them here.', PAPER, CORAL, INK, 160)
        + phone(R+'07-share.png', 560, 320, 700, 'rotate(4deg)')
        + scanpop(R+'07-share.png', (20, 260, 1060, 960), 820, 60, 1340, -4, TEAL, ring=PAPER)))
    return F
