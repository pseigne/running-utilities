# Redesign plan: Running Utilities on the heat sheet

Branch: `redesign/heat-sheet`. Design source: [`design.md`](design.md), copied from
`ncaa-indoor-qualification` (its CSS is the reference implementation).

## Goal

Rebuild the Weekly Mileage Planner and the Track Split Calculator as one React app in the heat-sheet
design, so pierceseigne.com/running-utilities/ looks and behaves like the NCAA qualification tracker:
warm ground, black nav with the track curb, a black answer card with one big number, white data cards,
and one orange track card holding the one picture.

The app is built to grow: a shared component kit that later tools (and, in time, the NCAA app) can reuse,
and a tool registry so adding a tool means adding one folder and one entry.

This replaces the current approach (original files, byte-for-byte, in iframes behind a tab bar). The
originals are removed from this repo. They stay on GitHub in their own repositories,
`pseigne/weekly-mileage-planner` (`c818a2c`) and `pseigne/track-split-calculator` (`c0a14d7`), whose
latest commits are the ones `original-sources.json` recorded.

## Decisions

1. **React** (19, JSX, Vite plugin), matching the NCAA app's stack so components can move between them.
2. **Originals removed** here; their own GitHub repositories are the archive.
3. **No extras for now**: no saved week, no mi/km switch. Both tools keep their current scope.

## What stays the same

- URL and base path: `/running-utilities/`, hash routes `#weekly-mileage` and `#track-splits`, so
  existing links and back/forward keep working.
- `npm test` and `npm run build` → `dist/`. The portfolio deploy (`pseigne/website`,
  `deploy-pages.yml`) runs exactly those two commands and copies `dist/`, so it needs no change.
- Node ≥ 22.12. Both calculators keep their current results for valid input.

## Stack

Same versions and tools as `ncaa-qualification/package.json`:

- `react`, `react-dom` 19; `vite` 8 with `@vitejs/plugin-react`.
- `vitest` + `jsdom` + `@testing-library/react` for unit and component tests; `npm test` runs
  `vitest run`.
- `@playwright/test` stays for browser tests; add `@axe-core/playwright`.
- ESLint flat config with `react-hooks` and `react-refresh`, copied from the NCAA app; `npm run lint`.
- Removed: `chart.js`, Font Awesome, the CDN stubs in the browser tests.
- Archivo from Google Fonts, linked in `index.html` like the NCAA app.

## Architecture

```
index.html                 fonts, #root
src/
  main.jsx                 createRoot
  App.jsx                  Header + ToolSwitch + the current tool; hash routing; document.title
  tools.js                 registry: [{ slug, title, short, Component }], the only list of tools
  styles/
    tokens.css             :root tokens, light + dark, motion, type (from design.md)
    base.css               html/body, focus, .press, skip link, and the kit's styles
  kit/                     shared, tool-agnostic components (the reusable layer)
    Header.jsx             black nav with the curb; publishes --head; slot on the right
    Pills.jsx              pill group: links (aria-current) or radios (name/value/onChange)
    HeroCard.jsx           black answer card: title, number slot, lead, children
    BigNumber.jsx          .num with unit/superscript
    Card.jsx               white data card
    TrackCard.jsx          orange card with caption; children are the SVG
    DataTable.jsx          heat-sheet table: columns, rows, phone grid layout
    FinishLine.jsx         the line as a table row / divider
    NumberField.jsx        labelled numeric input, 44px, tabular, optional big variant
    DetailCard.jsx         hero sub-card: title, figure line, optional spark
    Source.jsx             source / credit line
    useMedia.js            matchMedia hook (phone/compact), as in the NCAA app
  tools/
    mileage/
      model.js             pure: totals, remaining, spread, rounding
      MileagePlanner.jsx   hero, week chart, day table, actions
      WeekChart.jsx        SVG week on the track card
    splits/
      model.js             pure: parse time, lap plan, splits, paces
      SplitCalculator.jsx  hero time field, pills, strip, split table
      LapStrip.jsx         SVG lap strip on the track card
tests/
  mileage.model.test.js, splits.model.test.js      pure logic
  kit.test.jsx                                     Pills, NumberField, DataTable, FinishLine
  mileage.test.jsx, splits.test.jsx, app.test.jsx  component behaviour and routing
  browser/tools.spec.js                            Playwright: real browser, phone, dark, axe
```

Rules for the kit: no tool-specific words or logic in `kit/`; components take data and labels as props
and restyle through tokens, never hard-coded colors. Anything that two tools would need goes in the kit;
anything only one tool needs stays in its folder. Later, the kit can move to its own package shared with
the NCAA app; nothing here should block that.

Routing: a small `useHash()` hook maps `#weekly-mileage` / `#track-splits` to the registry (unknown or
empty → first tool). Both tools stay mounted and the hidden one gets `hidden`, so inputs survive
switching, as they do now.

## The shell

- **Header**: black, paper text, "Running Utilities" at left, the 3px orange curb + white lane line. At
  right, a link back to pierceseigne.com in the nav-pill style.
- **Tool switch**: `Pills` as links under the nav: *Weekly mileage* · *Track splits*, built from the
  registry, with `aria-current`. Replaces the ARIA tablist.
- **Source**: at the bottom of each tool, in place of the original footers: "Built by Pierce Seigne ·
  Source on GitHub." The portfolio link opens at the top level; GitHub opens in a new tab.
- Skip link, `--head` measurement, focus ring, safe-area gutters, and reduced motion as in design.md.

## Weekly Mileage Planner

The question: *how many miles are left this week, and where do they go?*

1. **Hero card**: title "Weekly mileage"; the big number is the **remaining miles** (unit "mi"); lead:
   "24 of 50 miles planned. 26 to go across 3 open days, about 8.7 a day." Over-goal and no-goal states
   get their own sentences ("2.5 miles over your 50-mile goal." / "Set a weekly goal to see what's
   left."). The goal is a big `NumberField` on the black card.
2. **Track card: the week**: seven columns, one per day, white bars to scale. Days you entered are
   filled white; days filled by spreading are hollow white outlines (the same filled/hollow language as
   in/out runners). **The line** is a 3px black horizontal stroke at the even daily average that reaches
   the goal, labelled "8.7 mi a day to reach 50". The caption explains it in a sentence. Bars animate over
   `--run`, and don't animate with reduced motion.
3. **Table card: the days**: `DataTable` rows Mon–Sun: day (18px cond 600), a `NumberField`, and a
   running total in `--ink-2`. Spread values show in `--ink-2` with a "spread" note until edited. A
   `FinishLine` under Sunday: "Goal · 50 mi".
4. **Actions**: "Spread the rest over open days" (ink pill), disabled with a reason when there are no
   open days or nothing remains; a "Clear week" text link.
5. **Fixes** (in `model.js`, with tests): an empty goal shows the empty state, not `NaN`; spread miles
   round to 0.1 and the rounding remainder lands on the last open day, so the total matches the goal
   exactly; a negative remainder is never spread. The broken `<h2>…</span>` markup and the emoji theme
   toggle go away; the theme follows the system, like the NCAA app.

## Track Split Calculator

The question: *what do I need to run each lap?*

1. **Hero card**: title "Track splits"; the big number is **the goal time** itself, an editable
   h:mm:ss.ss group set in the 144px number style (three labelled `NumberField`s that read as one mark).
   Lead: "A 4:00.00 mile is 59.65 per 400 m, 2:29.13 per km." `DetailCard`s for "Per 400 m" and
   "Per km / mile".
2. **Choices**: two `Pills` groups (radio mode) on the ground: distance (800 m, 1500 m, Mile, 3000 m,
   5000 m, 10,000 m, Other) and track (200 m, 400 m, Other). "Other" reveals a labelled metres field
   inline, never a placeholder-only input.
3. **Track card: the lap strip**: one lane per lap, a white dot at each split with its cumulative time,
   the start offset drawn as a short first segment ("Start 9 m before the line" for a mile on a 400),
   and the finish as the black line. The caption says it in a sentence.
4. **Table card: the splits**: Lap · Distance · Split · Cumulative in `DataTable`: 40px rows,
   right-aligned tabular marks, the first partial lap labelled as such, a `FinishLine` with the goal
   time at the end, and the phone grid layout from design.md.
5. **Behaviour**: results appear as soon as there is a distance and a time above zero (no hidden
   "first input" flag); the "[ Scroll to See Splits ]" hint goes because the strip and table are in
   view; changes update instantly; minutes or seconds over 59 roll over into the mark instead of being
   computed silently.
6. **Fixes** (in `model.js`, with tests): a custom distance no longer overrides a preset chosen after
   it; the mile shows as "1609 m" with the 9.34 m start explained; a custom track length is ignored until
   it's valid; the splits are a real `<table>` with a caption for screen readers.

## Removing the originals

Delete `public/weekly-mileage/`, `public/track-splits/`, `original-sources.json` and
`tests/originals.test.js`, plus the iframe shell (`src/main.js`, `src/styles.css`) and the footer-link
retargeting. The README links to the two original repositories instead of describing the checksums.

## Phases

Each phase ends green (`npm run lint`, `npm test`, `npm run test:browser`, `npm run build`) and is one
commit.

1. **Foundation**: React + Vite + Vitest + ESLint set up; tokens and base CSS ported from the NCAA app;
   `Header`, `Pills`, `Source`, the registry and hash routing; placeholder tool sections; originals and
   the iframe shell removed; tests for routing, history, keyboard, and `--head`.
2. **Kit**: `HeroCard`, `BigNumber`, `Card`, `TrackCard`, `DataTable`, `FinishLine`, `NumberField`,
   `DetailCard`, with component tests (labels, 44px targets, phone grid, the line).
3. **Mileage model**: `tools/mileage/model.js` with unit tests for totals, remaining, spread and
   rounding, over-goal, empty goal.
4. **Mileage view**: hero, day table, the line, actions, `WeekChart`; tests for the old scenario (goal
   50, Monday 20 → 30 left → 5 a day) and the new states.
5. **Splits model**: `tools/splits/model.js` with unit tests: 800 in 2:00 (2 laps, 2:00.00), 1500 on a
   400 (300 m first), the mile start offset, a 200 m track, custom distance and track, hours.
6. **Splits view**: hero time field, pills, `LapStrip`, split table; tests including keyboard use of the
   pills.
7. **Polish and checks**: phone (375px), tablet, ≥ 1440px; dark mode; reduced motion; 44px targets;
   axe in Playwright; side-by-side screenshots against the NCAA app for nav, card radii, type, and
   colors.
8. **Docs and ship**: README rewritten; PR from `redesign/heat-sheet`; check that `pages.yml` still
   passes. After merge, update the portfolio write-up (`website/public/projects/running-utilities.md` in
   `pseigne/website`), which still describes the iframes and the integrity check.
