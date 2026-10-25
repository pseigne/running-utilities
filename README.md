# Running Utilities

A **weekly mileage planner** and a **track split calculator**, at **https://pierceseigne.com/running-utilities/**.

- **Weekly mileage**: set a weekly goal, enter the days you've planned, and see what's left. Spread the rest
  evenly over the open days, in tenths of a mile, with the week adding up to the goal exactly. The week is
  drawn on the track against the daily average that makes the goal.
- **Track splits**: enter a goal time, pick a race and a track (or enter your own), and get the split and
  the clock for every lap, with the short first stretch of races that aren't whole laps (the 300 m of a
  1500, the 9 m of a mile) and the pace per kilometre and mile.

Both tools use the heat-sheet design of the NCAA qualification tracker, described in [`design.md`](design.md).
Hash links (`#weekly-mileage`, `#track-splits`) open a tool directly and work with back and forward. Both
tools stay loaded, so switching between them keeps what you typed.

The original versions live on in their own repositories,
[weekly-mileage-planner](https://github.com/pseigne/weekly-mileage-planner) and
[track-split-calculator](https://github.com/pseigne/track-split-calculator).

## How it's built

React 19 and Vite. `src/tools.js` lists the tools; each lives in `src/tools/<name>/` as a `model.js` of
plain functions (the arithmetic, tested on its own) and the components that draw it. Shared components are
in `src/kit/`: the header, pill groups, the answer card and its number, data and track cards, the table, the
line, number fields, detail cards, and buttons. Nothing in the kit knows about a particular tool.

Adding a tool means a folder under `src/tools/` and one entry in `src/tools.js`. On the dev server, `#kit`
shows every kit component on one page; production builds leave it out.

## Development

Use Node 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev            # http://127.0.0.1:5173/running-utilities/
npm run lint
npm test               # Vitest: models and components
npx playwright install chromium
npm run test:browser   # Playwright: real browser, three widths, both themes, axe
npm run build
npm run preview
```

## Publishing

Pushes to `main` lint, run both test suites, build, and publish to `https://pseigne.github.io/running-utilities/`
through GitHub Actions.

The portfolio deployment includes this public repository's built files under `/running-utilities/` on
`pierceseigne.com`. It checks for new commits once daily at 06:07 UTC and deploys when needed; a manual run of
the portfolio deployment publishes immediately. It runs `npm test` and `npm run build` and copies `dist/`.
This project does not set its own CNAME or change the portfolio domain.
