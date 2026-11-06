"""Google Play feature graphic 1024x500 for Tandava Studio, from the Play captures.
Run: CHROME=... python3 fg_tandavastudio.py -> out/tandavastudioplay/feature-graphic-1024x500.png"""
import subprocess, os
from PIL import Image
import engine
engine.SW, engine.SH = 1080, 1920
from engine import HERE, CHROME, FONTS, BASE, phone
from set_tandavastudioplay import R, INK, TEAL, LIME, CORAL, PAPER, brackets

css = f'''html,body{{width:1024px;height:500px}} body{{background:{INK}}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(rgba(62,230,210,.08) 2px,transparent 2px),linear-gradient(90deg,rgba(62,230,210,.08) 2px,transparent 2px);background-size:50px 50px}}
.t{{position:absolute;left:56px;top:52px;font:600 15px 'IBM Plex Mono';letter-spacing:.2em;text-transform:uppercase;color:{PAPER};opacity:.7}}
.hh{{position:absolute;left:50px;top:88px;font-weight:800;font-size:112px;line-height:.86;letter-spacing:-.055em;color:{PAPER};white-space:nowrap}}
.hh span{{display:inline-block;background:{LIME};color:{INK};padding:0 18px 8px 12px;margin-left:-8px;transform:rotate(-3deg);border-radius:8px}}
.s{{position:absolute;left:56px;top:330px;width:470px;font-weight:700;font-size:28px;line-height:1.15;color:{PAPER}}}
.phone{{border-radius:34px;padding:8px}} .phone .scr{{border-radius:27px}} .phone .cam{{top:15px;width:11px;height:11px;margin-left:-5px}}
.brk i{{position:absolute;width:44px;height:44px;border-style:solid;border-color:var(--c)}}
.brk{{position:absolute;z-index:9}}'''
body = ('<div class="grid"></div><div class="t">Tandava Studio</div>'
        '<div class="hh">scan them<br><span>in.</span></div>'
        '<div class="s">Check members in at the door with your camera.</div>'
        + phone(R + 'member-pass.png', 220, 600, 70, 'rotate(-8deg)', 'opacity:.95')
        + phone(R + '01-scan-success.png', 250, 760, 40, 'rotate(5deg)')
        + brackets(744, 22, 272, 456, LIME, inset=0, t=7))
out = HERE / 'out' / 'tandavastudioplay'; out.mkdir(parents=True, exist_ok=True)
f = HERE / '_tandavastudio-fg.html'
f.write_text(f'<!doctype html><html><head><meta charset="utf-8">{FONTS}<style>{BASE}{css}</style></head><body>{body}</body></html>')
png = out / 'feature-graphic-1024x500.png'
subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                '--window-size=1024,500', '--virtual-time-budget=9000', f'--screenshot={png}', f.as_uri()], check=True, capture_output=True)
Image.open(png).convert('RGB').save(png); print('wrote', png)
