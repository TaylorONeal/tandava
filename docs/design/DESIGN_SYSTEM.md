# Tandava design system

One look for the website, the demo studio and the apps. It comes from the
Tandava Studio App Store art (`set_tandavastudio.py` in the store assets): the
"studio front door". Light by default.

If something here disagrees with code, `src/index.css` (tokens) and
`tailwind.config.ts` (raw brand values) win. Update this file in the same PR.

## Audit that led here (Nov 2026)

What made the old site and app read as generic or dated:

- **Default dark purple everywhere.** `:root` was the "Mystic Night" theme, and
  `ThemeContext` re-applied it inline on every page, so even pages meant to be
  light came out dark.
- **Serif display font on software screens** (Cormorant Garamond) next to DM Sans.
- **Template sections:** hero, then three equal cards, then an icon grid of 20
  features with "Try it" links, then gradient role cards, then a centered CTA.
- **Glows and blobs:** blurred gradient circles, gradient text, teal glows.
- **Filler copy:** "A sanctuary for movement, breath, and community",
  "Streamlined daily operations", "Everything a studio needs".
- **Joke and stock names in sample data:** "Mariana Trench", "Beyonce Pangolin",
  "Sarah Chen", "James Wilson".
- **Two design docs that disagreed** (`docs/ai-agents/DESIGN_SYSTEM.md` described
  warm off-white and gold; the code was dark purple and teal).

## Direction

A studio's front desk on a good morning: paper, ink, one highlighter. The
check-in pass and the class schedule are the two objects the product is about,
so they are the visual motifs, not abstract shapes.

- Paper background, ink text. Lime is a highlighter behind words, never text.
- Teal means "checked in" or "confirmed". Coral means "needs attention".
- One grotesque (Bricolage Grotesque) for everything, IBM Plex Mono for labels,
  times and counts. No serif.
- Real things over illustrations: real app captures, real schedule rows.
- Rules and spacing before boxes. A card only when it is an object (a pass, a
  class, a phone).

## Tokens (`src/index.css`)

| Role | Value | Use |
|---|---|---|
| `--background` | paper `#FFF8EE` | page |
| `--foreground` / `--primary` | ink `#0E0A12` | text, primary buttons, focus ring |
| `--card` | white | objects: passes, class cards, panels |
| `--secondary` / `--muted` | warm paper tints | quiet fills, inputs |
| `--accent` | lime `#D7FF3F` | highlighter, selected chips |
| `--accent-mint` | teal `#3EE6D2` | checked in, success fills |
| `--accent-peach` | coral `#FF6B8B` | attention fills |
| `--destructive` | `350 72% 46%` | errors (text-safe red) |
| `--radius` | `0.875rem` | cards; buttons are pills |
| shadows | ink-tinted, negative spread | no glows |

`.dark` holds the same system on ink. It is opt-in (a studio's "Night" theme),
not the default and not tied to the system setting.

Studio themes (`src/contexts/ThemeContext.tsx`): the default `tandava-paper`
sets no overrides, so the tokens apply as written.

## Type

- Display: Bricolage Grotesque 800, tracking `-0.04em`, leading `0.95` to `1`.
- Body: Bricolage Grotesque 400 to 500, 16px on the web, 14 to 15px in the app.
- Labels: IBM Plex Mono 500 to 600, uppercase, tracking `0.2em` (eyebrows), or
  normal case for times and counts.

## Marketing primitives (`src/components/marketing/`)

`Eyebrow`, `Band` (highlighter), `CtaLink` / `CtaAnchor`, `ScanFrame`,
`PhoneShot`, plus the redesign's `PassStub`, `ScheduleBoard`, `RuledList` and
`Section`. Pages compose these; they don't restyle them.

## Copy

Plain and specific. No em dashes, no "seamless", "elevate", "unleash",
"sanctuary", "everything you need". Say what the screen does.
