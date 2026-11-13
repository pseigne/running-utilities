# Design system: the heat sheet

The visual language of the NCAA Track and Field National Qualification Tracker, written so other track
tools (first: Running Utilities) can share it. The reference implementation is
`ncaa-qualification/src/index.css` in this repo; when this document and that file disagree, the CSS wins
and this document gets fixed.

## The idea in one paragraph

A meet's heat sheet is the system: plain type, ruled rows, numbers that line up. On top of it sits exactly
**one picture**, the race on the track, and **one accent**, the line. Every screen answers one question
with one big number, explains it in a sentence, then shows the evidence in a table and on the track.
Nothing decorates; every mark on the page is something a runner would read.

## Principles

1. **One number per screen.** The hero holds the answer (a cutoff, a remaining mileage, a goal time) at
   display size. Everything else is supporting evidence below it.
2. **One accent: the line.** Red/orange marks the single thing that matters (the qualifying line, the
   goal, the pace). If two things are accented, neither is.
3. **Surfaces mean something.** Warm ground = the page. Black card = the answer. White card = the data.
   Orange card = the track. Don't put data on the black card or prose on the track.
4. **Numbers are type.** Tabular figures everywhere, condensed widths for names and labels, marks
   aligned on the decimal.
5. **Say it plainly.** Sentence case, no jargon, full sentences in leads and captions. A sentence
   explains the number rather than a legend.
6. **Every state is honest.** Missing data says it is missing; estimates say they are estimates;
   loading and failure each get one live message and a way forward.

## Color tokens

Defined on `:root`; dark mode redefines them under `prefers-color-scheme: dark`. Components restyle by
reassigning tokens on a surface (`--bg`, `--ink`, `--line`…), never by hard-coding colors inside them.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--page` | `#EDEBE6` | `#121212` | Warm grey ground behind everything |
| `--page-rule` / `--page-sel` | `#dcd9d2` / `#e4e1da` | `#262625` / `#1d1d1c` | Rules and selected rows on the ground; pill-group trough |
| `--card` | `#ffffff` | `#1c1c1b` | Data cards (tables, inputs) |
| `--card-rule` / `--card-sel` | `#ebebe8` / `#f2f2ef` | `#2c2c2a` / `#252524` | Row rules and hover inside cards |
| `--ink` | `#151515` | `#efefec` | Primary text |
| `--ink-2` | `#5c5c58` | `#a5a5a0` | Secondary text, column heads, units |
| `--nav` / `--hero` | `#151515` | `#151515` / `#202020` | The nav bar and the answer card |
| `--paper` | `#F4F2EE` | same | Text on black surfaces; light pill buttons |
| `--line` | `#c4361b` | `#ff6a4a` | **The accent** on light/white surfaces; focus ring |
| `--accent` | `#FF7A57` | same | The accent on black surfaces (`--line` is reassigned to it there) |
| `--track` | `#C4532F` | same | The track card |
| `--track-ink` | `#5a1c0c` | same | Dark details drawn on the track |
| `--ring` | `#8c8c88` | `#8a8a87` | Hollow markers (out / not reached) |

Rules:

- On the black hero card: `--ink: var(--paper)`, `--ink-2: #A9A69F`, `--rule: rgba(255,255,255,.14)`,
  `--line: var(--accent)`.
- On the track card everything is white (`--ink`, `--rule`, `--line` = `#fff`) and the line becomes a
  **3px black stroke** (`#151515`). Text on the track is white at ≥ 85% opacity; captions are pure white
  because anything dimmer drops under 4.5:1.
- Body text holds 4.5:1 against its surface in both themes. Check new pairings; don't eyeball them.

## Type

- **Archivo** (Google Fonts, variable: `wdth 62..125`, `wght 400..700`), falling back to `system-ui`.
- `font-variant-numeric: tabular-nums` on `html`. Numbers never jitter.
- `--cond: 72%` (`font-stretch`) for names, event labels, headings, and card titles. Big numbers use
  `88%`.
- Weights: 400 body, 600 emphasis. No 700+ in UI text.

| Role | Size / line-height | Weight / stretch | Notes |
|---|---|---|---|
| Hero number (`.num`) | 144px card / 128px page / 84px phone, `.86` | 600, 88%, `-.035em` | Units in a `small` at 20px, `--ink-2` |
| Page title (`h1`) | 56px / 40px phone, `1` | 600, cond, `-.01em` | |
| Lead (`.lead`, `.dek`) | 20px / 18px phone | 400 | Max 30–60ch, one or two sentences |
| Section heading (`h2`) | 20px | 600, cond | |
| Table cell | 16px; name/mark 18px | 600 cond for names | Row height 40px (48px on summary boards) |
| Column head / caption / source | 14px | 400, `--ink-2` | |
| Eyebrow (dialogs only) | 13px, `.06em`, uppercase | 600, `--ink-2` | The only uppercase in the system |

## Surfaces and layout

- **Nav (`.top`)**: sticky, `--nav` black, paper text, site name at left (full name ≥ 961px, short name
  below), one control at right (e.g. the year pill). Its bottom edge is the track: a 3px orange curb
  (`inset 0 -3px 0 var(--track)`) and a 1px white lane line. Its height is published as `--head` for
  anything pinned beneath it.
- **Page (`.wrap`)**: on `--page`, max 1440px (1680px for the main view from 1440px wide), 40px gutters,
  a 248–272px index column on the left when a view has a list of things to pick from.
- **Hero card (`.herocard`)**: `--hero` black, radius 24px (18px phone), padding `28px 32px 22px`. Holds
  the title, the hero number, a one-sentence lead, and up to two detail cards.
- **Table card (`.tablecard`)**: `--card` white, radius 20px (18px phone), padding 16px, a hairline
  shadow `0 0 0 1px rgba(30,25,15,.06)`. No other shadows on the page.
- **Track card (`.race.card`, `.rail`)**: `--track` orange, radius 24px, white lanes. The one picture.
- **Dialogs (`.sheet.detail`)**: a floating card, never full screen: `--page` ground, sticky black head
  with eyebrow + 40px title + a paper pill Close button, radius 24px, `0 24px 80px rgba(0,0,0,.35)`.
  Body repeats the page: a black hero band, white boxes, the track.
- Radii: 24 (big cards) · 20 (data cards) · 16 (detail cards) · 8 (rows, popovers) · 999 (pills).
- Spacing comes in 4px steps; card-to-card gap is 12–16px.

## Components

**Pill groups (`.filters .grp`)** — segmented choices (men/women, indoor/outdoor, tool, distance). A
`--page-sel` trough with 4px padding; options are 36px tall, 15px/500, `--ink-2`; the current one is an
`--ink` pill with `--page` text, 600. Each choice is a link or radio with `aria-current`/`checked` and a
real URL or form value. Don't use pills for more than ~7 options.

**Nav pill (`.yearpick`)** — a native `<select>` styled as a translucent pill (`rgba(255,255,255,.08)`)
on the nav with a chevron. Native control so phones get their own picker.

**Hero number** — the answer, with its unit or symbol as a small superscript. Under it, a lead sentence
that says what the number means in words, and optional trend text with a sparkline in the accent.

**Detail cards (`.detail-card`)** — inside the hero: 16px radius, 1px rule border, title (18px cond 600)
with a sparkline to its right, one explanatory line in `--ink-2` with the key figure in `--ink` bold, and
a "Verb →" link line whose arrow nudges 3px on hover. They open dialogs.

**Tables** — full-width, collapsed borders, a 1px `--rule` top border per row, 40px rows, right-aligned
marks with a fixed-width symbol slot so decimals align. Hover/selection uses `--sel`; the active row
scales its words (not the row) to 1.05. On phones (≤ 720px) rows become a 3-column grid: place · name
over team · mark over gap; `thead` is hidden.

**The line (`.finish`)** — a row-width divider: 2px top border in `--line`, accent text, 14px, with the
label at left and the figure at right. It is the only red in the table. On the track it is a 3px black
stroke with a black-ringed marker for whoever is on it.

**The race strip** — an SVG on the track card: lanes as white rules, one dot per runner/value (filled =
in, hollow ring = out, black with white stroke = on the line), labels in 14px white, a caption under it
that says in a sentence what the picture shows. On wide screens it stands up as a sticky rail beside the
table; on phones it sticks under the nav with a one-line mini hero above it.

**Stats (`.stats`)** — `dl` grid, `minmax(150px,1fr)`; each item has a top rule, a 13px label, a 30px
cond 600 value (22px phone). The accent item uses `--accent`.

**Buttons** — primary action: paper pill on black, or ink pill on paper, min 44px tall, 600. Secondary:
underlined text link (`.more`), 600, `text-underline-offset: 4px`. No outlined or gradient buttons.

**Source line (`.source`)** — 14px `--ink-2`, max 72ch, at the bottom of a view: where the data came
from, when, and the link out. Replaces a footer.

**Symbols and popovers** — footnote symbols (`.sym`) sit as small superscripts with a 44px invisible hit
area; their popover is an 8px-radius box with a 1px `--ink` border, 14px text, max 280px.

## Motion

- Tokens: `--ease: cubic-bezier(.2,.8,.2,1)`, `--fast: 120ms`, `--run: 700ms`.
- `.press`: scale `.985` on hover, `.965` on active.
- Dots run to their places over `--run`; the line slides over 420ms; dialogs rise 12px and fade over
  220ms (32px from the bottom on phones); chips grow from `.45` over 150ms.
- `prefers-reduced-motion: reduce` sets `--fast` and `--run` to 0 and removes every transform and
  animation. Every new animation needs its reduced-motion override written alongside it.

## Accessibility (non-negotiable)

- Every target is at least **44×44px**; small symbols get an invisible 44px `::after` hit area.
- Focus: `2px solid var(--line)`, offset 2px, radius 4px, via `:focus-visible`. On the nav, `--accent`.
- A skip link ("Skip to the list") that drops in over the nav on focus.
- One `role="status"` live region per view for loading and failure, with the retry button outside it.
- Dialogs: native `<dialog>` with `showModal()`, Escape and Close both close, Tab wraps, focus returns to
  the opener or the page heading.
- Links carry an `aria-label` that starts with their visible words. Charts have a text equivalent
  (caption + table).
- Respect safe-area insets on the nav, gutters, and bottom padding.
- Accessible names, focus order, and live regions are covered by tests, not just checked by eye.

## Responsive

| Width | Layout |
|---|---|
| ≤ 720px | Single column, 16px gutters; index becomes a "picker" button that opens a sheet; tables become grids; track sticks under the nav; hero number 84px |
| 721–1099px | Index column `clamp(176px,22vw,224px)`, 24px gutters, hero lead drops under the number |
| 1100–1279px | Index hidden behind the picker; table + sticky track rail side by side |
| ≥ 1100px | `.split`: table ~64% / track rail ~36%, sticky column heads |
| ≥ 1440px | Content widens to 1680px, centered |
| ≥ 1600px | Hero lead sits beside the number |

## Voice

- Sentence case everywhere, including buttons ("Every qualifying line", "Try again").
- Leads and captions are full sentences with a period. Say what the reader is looking at and what it
  means, then the caveat.
- Use the runner's words: mark, line, lap, split, mileage. Spell out what an estimate is.
- Code comments read the same way: a plain sentence about *why*, above the rule they explain.

## Don'ts

- No emoji in UI, no icon fonts, no gradients (except the 12px fade under a pinned strip), no drop
  shadows beyond the hairline and the dialog shadow.
- No second accent color, no green/red good/bad coding; use filled vs hollow and ink vs `--ink-2`.
- No chart libraries for the one picture: it is hand-drawn SVG so it can share tokens and motion.
- No full-screen modals, no toasts, no placeholder-only inputs (every input has a visible label).
- No hard-coded colors in components; reassign tokens on the surface instead.
