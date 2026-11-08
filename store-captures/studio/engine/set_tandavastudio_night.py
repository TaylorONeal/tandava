"""Tandava Studio App Store set, "night shift" variation (Nov 7 2026, lane 3). 7 frames at 1320x2868.

Darker, front-desk energy, bigger type than set_tandavastudio.py. Every frame is a near-black field with ONE neon
accent (lime, teal or coral, rotating), a giant two-line lowercase headline where line two glows in the accent, an
outlined ghost word bleeding off the right edge, and the camera-viewfinder brackets around the enlarged breakout.
Own style per app (Taylor, Oct 13): not JetSweep (condensed caps, tickets), not CueCraft (caps plus italic serif),
not TeacherTree.

Captures: real WebKit 440x956 @3x captures of the Studio and member native bundles from the #115 workflow
(run 42422954740, branch store-captures/studio-20261106-out, store-out/final/raw/ios), synthetic Juniper Yoga
review studio on a throwaway local Supabase. Nothing is drawn inside a screen: phones and pops show the capture
pixels only; stickers sit outside the screen area or on the canvas.

Copy rules: no price words, no install prompts, no rankings or superlatives, no em dashes, not AI-led. Claims match
the 1.0 candidate: scanning, roster check-in, teaching schedule, schedule and price edits, sharing.
Run from this folder: python3 engine_ios.py tandavastudio_night"""
from engine_ios import phone, pop, spark

R = 'raw/ios/tandavastudio/'
INK, NAVY, PLUM, GREEN = '#09090C', '#0B1020', '#160C1C', '#06140F'
LIME, TEAL, CORAL, PAPER = '#D7FF3F', '#3EE6D2', '#FF6B8B', '#FFF8EE'

CSS = f'''
.tag{{position:absolute;left:84px;top:120px;font:600 30px 'IBM Plex Mono',monospace;letter-spacing:.22em;text-transform:uppercase;z-index:6;color:{PAPER};opacity:.62}}
.tag b{{display:inline-block;width:18px;height:18px;border-radius:50%;margin-right:18px;vertical-align:2px}}
.h{{position:absolute;left:64px;right:20px;top:196px;font-weight:800;line-height:.82;letter-spacing:-.06em;z-index:6;white-space:nowrap;color:{PAPER}}}
.h em{{font-style:normal;display:block}}
.sub{{position:absolute;left:84px;right:90px;font-weight:700;font-size:60px;line-height:1.1;letter-spacing:-.02em;z-index:6;color:{PAPER};opacity:.86}}
.ghost{{position:absolute;right:-60px;font-weight:800;font-size:520px;line-height:.8;letter-spacing:-.07em;color:transparent;z-index:1;white-space:nowrap}}
.brk{{position:absolute;z-index:9;pointer-events:none}}
.brk i{{position:absolute;width:130px;height:130px;border-style:solid;border-color:var(--c)}}
.chip{{position:absolute;z-index:10;display:flex;align-items:center;gap:20px;height:120px;padding:0 50px;border-radius:999px;
  font:800 58px 'Bricolage Grotesque',sans-serif;letter-spacing:-.02em;white-space:nowrap}}
.glow{{position:absolute;border-radius:50%;filter:blur(140px);z-index:0}}
.scan{{position:absolute;left:0;right:0;height:6px;z-index:2;opacity:.55}}
'''


def head(l1, l2, sub, accent, size=280, ghost=''):
    sub_top = 196 + int(2 * size * .82) + 64
    g = (f'<div class="ghost" style="top:{sub_top + 120}px;-webkit-text-stroke:3px {accent};opacity:.22">{ghost}</div>'
         if ghost else '')
    return (f'<div class="tag"><b style="background:{accent}"></b>Tandava Studio</div>'
            f'<div class="h" style="font-size:{size}px">{l1}<em style="color:{accent};text-shadow:0 0 60px {accent}55">{l2}</em></div>'
            f'<div class="sub" style="top:{sub_top}px">{sub}</div>' + g)


def field(bg, accent, gx, gy):
    """Dark field, one soft accent glow and a faint scanner line. Background only, never inside a screen."""
    return (f'<style>body{{background:{bg}}}</style>'
            f'<div class="glow" style="left:{gx}px;top:{gy}px;width:900px;height:900px;background:{accent};opacity:.20"></div>'
            f'<div class="scan" style="top:1010px;background:linear-gradient(90deg,transparent,{accent},transparent)"></div>')


def brackets(left, top, w, h, color, inset=-36, t=16):
    s = f'--c:{color};'
    return (f'<div class="brk" style="left:{left + inset}px;top:{top + inset}px;width:{w - 2 * inset}px;height:{h - 2 * inset}px;{s}">'
            f'<i style="left:0;top:0;border-width:{t}px 0 0 {t}px;border-radius:36px 0 0 0"></i>'
            f'<i style="right:0;top:0;border-width:{t}px {t}px 0 0;border-radius:0 36px 0 0"></i>'
            f'<i style="left:0;bottom:0;border-width:0 0 {t}px {t}px;border-radius:0 0 0 36px"></i>'
            f'<i style="right:0;bottom:0;border-width:0 {t}px {t}px 0;border-radius:0 0 36px 0"></i></div>')


def scanpop(src, box, w, left, top, rot, color, z=6):
    html, h = pop(src, box, w, left, top, rot=rot, ring=INK, ringw=8, radius=34,
                  shadow=f'0 50px 120px rgba(0,0,0,.6),0 0 90px {color}40', z=z)
    return html + brackets(left, top, w, h, color)


def chip(text, left, top, bg, fg, rot=-5):
    return (f'<div class="chip" style="left:{left}px;top:{top}px;background:{bg};color:{fg};transform:rotate({rot}deg);'
            f'box-shadow:0 20px 60px rgba(0,0,0,.5)">{text}</div>')


def frames():
    F = []
    # 1 HERO: scan them in. Studio phone with the real green result, member pass phone behind it.
    F.append(('ios-01', '',
        field(INK, LIME, 520, 1300)
        + head('scan them', 'in.', 'Check members in at the door with your camera.', LIME, 262, 'scan')
        + phone(R + 'member-pass.png', 620, 30, 1240, -9, 'opacity:.92')
        + phone(R + '01-scan-success.png', 800, 480, 1130, 4)
        + scanpop(R + '01-scan-success.png', (30, 700, 1290, 1340), 1010, 150, 2140, -3, LIME)
        + chip('&#10003; checked in', 760, 1000, LIME, INK, 6)
        + spark(1170, 120, 100, LIME, 10)))
    # 2 the dashboard, Scan passes on top
    F.append(('ios-02', '',
        field(NAVY, TEAL, -200, 1500)
        + head('front desk,', 'pocket size.', 'Your studio, today, on one screen.', TEAL, 236, 'desk')
        + phone(R + '02-dashboard.png', 860, 230, 1060, -3)
        + scanpop(R + '02-dashboard.png', (30, 380, 1290, 1100), 1080, 120, 2080, 3, TEAL)))
    # 3 roster tap
    F.append(('ios-03', '',
        field(PLUM, CORAL, 400, 1200)
        + head('no pass?', 'tap in.', 'Check people in from the class roster too.', CORAL, 280, 'tap')
        + phone(R + '03-roster.png', 840, 380, 1060, 5)
        + scanpop(R + '03-roster.png', (40, 690, 1280, 1475), 1060, 70, 1940, -4, CORAL)
        + chip('2 checked in', 720, 2700, CORAL, INK, -5)))
    # 4 teachers
    F.append(('ios-04', '',
        field(GREEN, LIME, -100, 1400)
        + head('teachers', 'get theirs.', 'Assigned classes and rosters, nothing else.', LIME, 250, 'teach')
        + phone(R + '04-teach.png', 860, 230, 1090, -4)
        + scanpop(R + '04-teach.png', (30, 680, 1290, 1600), 1020, 150, 1980, 3, LIME)))
    # 5 weekly schedule (no cancel claim until class cancel is verified on device)
    F.append(('ios-05', '',
        field(INK, TEAL, 500, 1250)
        + head('your week,', 'your way.', 'Add weekly classes and move times.', TEAL, 250, 'week')
        + phone(R + '05-schedule.png', 860, 400, 1060, 4)
        + scanpop(R + '05-schedule.png', (30, 600, 1290, 1480), 1060, 60, 2010, -3, TEAL)
        + chip('vinyasa &middot; pilates &middot; barre', 60, 1830, TEAL, INK, -7)))
    # 6 classes and pricing
    F.append(('ios-06', '',
        field(NAVY, CORAL, -150, 1350)
        + head('set your', 'prices.', 'Drop-ins, class packs and memberships.', CORAL, 280, 'set')
        + phone(R + '06-offerings.png', 860, 230, 1070, -4)
        + scanpop(R + '06-offerings.png', (30, 660, 1290, 1860), 1000, 160, 1850, 3, CORAL)))
    # 7 share the link
    F.append(('ios-07', '',
        field(PLUM, LIME, 450, 1300)
        + head('share the', 'link.', 'Members book from your page. You see them here.', LIME, 270, 'link')
        + phone(R + '07-share.png', 860, 380, 1070, 4)
        + scanpop(R + '07-share.png', (30, 390, 1290, 1330), 1060, 60, 1990, -4, LIME)
        + chip('your page &middot; tap to book', 90, 1190, LIME, INK, -5)))
    return F
