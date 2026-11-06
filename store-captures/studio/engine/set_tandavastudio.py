"""Tandava Studio App Store set (iPhone), 7 frames at 1320x2868. Visual language: the studio front door.
Ink black, the app's own teal pushed loud, acid lime and hot coral. Giant lowercase Bricolage Grotesque, the second
line laid on a slanted highlighter band, camera-scanner corner brackets around every breakout, and perforated
wristband stickers. Not a copy of JetSweep (condensed caps, tickets) or CueCraft (caps plus italic serif).

Captures (NOT TAKEN YET): iPhone 17 Pro Max simulator "ShotsPM" or a real iPhone, Tandava Studio built from tandava
PR #113 (stacked on #109), synthetic review studio only, status bar 9:41. Save to raw/ios/tandavastudio/:
  01-scan-success.png   /scan right after a pass scan, green "is checked in" card
  02-dashboard.png      live dashboard with the Scan passes card on top
  03-roster.png         teaching schedule roster dialog, two checked in, one Check in button
  04-teach.png          teaching schedule list (assigned classes)
  05-schedule.png       weekly schedule editor
  06-offerings.png      Classes and pricing (drop-in, pack, membership)
  07-share.png          Share your classes with the iOS share sheet open
  member-pass.png       Tandava (member app) My Schedule with the Check-in pass open, for frame 1's second phone
Crop boxes below are first guesses for a 1320x2868 capture; tune each one after capture so no half-words show.

Copy rules: no price words, no install prompts, no rankings or superlatives, no em dashes. Claim only what the
candidate does: scanning, roster check-in, schedule and price edits, sharing. No payments, reports, CRM or push.
Synthetic names only (the app's own sample names or obviously made up)."""
from engine_ios import phone, pop, stk, spark

R = 'raw/ios/tandavastudio/'
INK, INK2, TEAL, LIME, CORAL, PAPER, PLUM = '#0E0A12', '#1A1420', '#3EE6D2', '#D7FF3F', '#FF6B8B', '#FFF8EE', '#2A1636'

CSS = f'''
.tag{{position:absolute;left:84px;top:118px;font:600 30px 'IBM Plex Mono',monospace;letter-spacing:.2em;text-transform:uppercase;z-index:6}}
.h{{position:absolute;left:70px;right:30px;top:200px;font-weight:800;font-size:236px;line-height:.84;letter-spacing:-.055em;z-index:6;white-space:nowrap}}
.h .band{{display:inline-block;padding:0 34px 18px 22px;margin-left:-18px;transform:rotate(-3deg);border-radius:14px}}
.sub{{position:absolute;left:84px;right:70px;font-weight:700;font-size:58px;line-height:1.1;letter-spacing:-.02em;z-index:6}}
.brk{{position:absolute;z-index:9;pointer-events:none}}
.brk i{{position:absolute;width:120px;height:120px;border-style:solid;border-color:var(--c)}}
.wb{{position:absolute;z-index:10;display:flex;align-items:center;gap:22px;height:118px;padding:0 54px;border-radius:22px;
  font:800 58px 'Bricolage Grotesque',sans-serif;letter-spacing:-.02em;white-space:nowrap;
  -webkit-mask:radial-gradient(circle at 0 50%,transparent 20px,#000 21px) left/51% 100% no-repeat,
               radial-gradient(circle at 100% 50%,transparent 20px,#000 21px) right/51% 100% no-repeat}}
.grid{{position:absolute;inset:0;z-index:0;background-image:linear-gradient(var(--g) 2px,transparent 2px),linear-gradient(90deg,var(--g) 2px,transparent 2px);background-size:110px 110px}}
'''

def head(l1, l2, sub, fg, band_bg, band_fg, size=236, tag='Tandava Studio'):
    sub_top = 200 + int(2 * size * .84) + 70
    return (f'<div class="tag" style="color:{fg};opacity:.7">{tag}</div>'
            f'<div class="h" style="color:{fg};font-size:{size}px">{l1}<br>'
            f'<span class="band" style="background:{band_bg};color:{band_fg}">{l2}</span></div>'
            f'<div class="sub" style="color:{fg};top:{sub_top}px">{sub}</div>')

def brackets(left, top, w, h, color, inset=-34, t=14):
    """Camera-viewfinder corners around a breakout. The scan is the brand moment, so every frame echoes it."""
    s = f'--c:{color};'
    return (f'<div class="brk" style="left:{left + inset}px;top:{top + inset}px;width:{w - 2 * inset}px;height:{h - 2 * inset}px;{s}">'
            f'<i style="left:0;top:0;border-width:{t}px 0 0 {t}px;border-radius:34px 0 0 0"></i>'
            f'<i style="right:0;top:0;border-width:{t}px {t}px 0 0;border-radius:0 34px 0 0"></i>'
            f'<i style="left:0;bottom:0;border-width:0 0 {t}px {t}px;border-radius:0 0 0 34px"></i>'
            f'<i style="right:0;bottom:0;border-width:0 {t}px {t}px 0;border-radius:0 0 34px 0"></i></div>')

def scanpop(src, box, w, left, top, rot, color, ring=INK, z=6):
    html, h = pop(src, box, w, left, top, rot=rot, ring=ring, ringw=10, radius=34, z=z)
    return html + brackets(left, top, w, h, color)

def band(text, left, top, bg, fg, rot=-6):
    return (f'<div class="wb" style="left:{left}px;top:{top}px;background:{bg};color:{fg};transform:rotate({rot}deg)">'
            f'{text}</div>')

def frames():
    F = []
    # 1 HERO ink: scan them in. Studio phone with the green result, member pass tilted behind it.
    F.append(('ios-01', f'body{{background:{INK}}}',
        f'<div class="grid" style="--g:rgba(62,230,210,.07)"></div>'
        + head('scan them', 'in.', 'Check members in at the door with your camera.', PAPER, LIME, INK, 260)
        + phone(R+'member-pass.png', 640, 40, 1180, -9, 'opacity:.96')
        + phone(R+'01-scan-success.png', 820, 470, 1080, 4)
        + scanpop(R+'01-scan-success.png', (30, 700, 1290, 1340), 1000, 160, 2120, -3, LIME)
        + band('&#10003; checked in', 740, 930, TEAL, INK, 6)
        + spark(1150, 150, 120, CORAL, 10)))
    # 2 teal: the dashboard
    F.append(('ios-02', f'body{{background:{TEAL}}}',
        f'<div class="grid" style="--g:rgba(14,10,18,.06)"></div>'
        + head('front desk', 'to go.', 'Your studio, today, on one screen.', INK, INK, LIME, 236)
        + phone(R+'02-dashboard.png', 860, 230, 1060, -3)
        + scanpop(R+'02-dashboard.png', (30, 380, 1290, 1100), 1080, 120, 2060, 3, CORAL)
        + spark(1120, 160, 130, PAPER, 8)))
    # 3 lime: roster tap
    F.append(('ios-03', f'body{{background:{LIME}}}',
        f'<div class="grid" style="--g:rgba(14,10,18,.06)"></div>'
        + head('tap.', 'checked in.', 'No pass? The roster works too.', INK, INK, LIME, 220)
        + phone(R+'03-roster.png', 840, 380, 1040, 5)
        + scanpop(R+'03-roster.png', (40, 690, 1280, 1500), 1060, 70, 1920, -4, INK, ring=PAPER)
        + band('2 of 8 here', 760, 2690, CORAL, INK, -5)))
    # 4 plum: teachers get their own view
    F.append(('ios-04', f'body{{background:{PLUM}}}',
        f'<div class="grid" style="--g:rgba(215,255,63,.06)"></div>'
        + head('teachers', 'get theirs.', 'Assigned classes and rosters, nothing else.', PAPER, CORAL, INK, 236)
        + phone(R+'04-teach.png', 860, 230, 1080, -4)
        + scanpop(R+'04-teach.png', (30, 680, 1290, 1600), 1020, 150, 1960, 3, TEAL)
        + spark(80, 1000, 100, LIME, -10)))
    # 5 paper: weekly schedule
    F.append(('ios-05', f'body{{background:{PAPER}}}',
        f'<div class="grid" style="--g:rgba(42,22,54,.06)"></div>'
        + head('your week,', 'your way.', 'Add classes, move times, cancel when needed.', INK, TEAL, INK, 236)
        + phone(R+'05-schedule.png', 860, 400, 1050, 4)
        + scanpop(R+'05-schedule.png', (30, 600, 1290, 1480), 1060, 60, 2000, -3, CORAL)
        + band('vinyasa · pilates · barre', 60, 1820, INK, LIME, -7)))
    # 6 coral: classes and pricing
    F.append(('ios-06', f'body{{background:{CORAL}}}',
        f'<div class="grid" style="--g:rgba(14,10,18,.07)"></div>'
        + head('set your', 'prices.', 'Drop-ins, class packs and memberships.', INK, INK, PAPER, 236)
        + phone(R+'06-offerings.png', 860, 230, 1060, -4)
        + scanpop(R+'06-offerings.png', (30, 660, 1290, 1860), 1000, 160, 1830, 3, LIME)
        + spark(1130, 150, 130, LIME, 12)))
    # 7 ink: share the link
    F.append(('ios-07', f'body{{background:{INK}}}',
        f'<div class="grid" style="--g:rgba(255,107,139,.07)"></div>'
        + head('share the', 'link.', 'Members book from your page. You see them here.', PAPER, CORAL, INK, 250)
        + phone(R+'07-share.png', 860, 380, 1060, 4)
        + scanpop(R+'07-share.png', (30, 300, 1290, 1300), 1060, 60, 1960, -4, TEAL, ring=PAPER)
        + band('your page · tap to book', 90, 1180, LIME, INK, -5)))
    return F
