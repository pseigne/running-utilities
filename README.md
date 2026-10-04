# Running Utilities

Weekly mileage planning and track splits, together at **https://pierceseigne.com/running-utilities/**.

## Development

Use Node 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
npm test
npx playwright install chromium
npm run test:browser
npm run build
npm run preview
```

Vite serves the app under `/running-utilities/`. The two tools use `#weekly-mileage` and `#track-splits` links, so refresh and browser navigation work on static hosting. Chart.js is bundled; calculations run in the browser. Inputs and theme preferences are saved in localStorage on the current browser, with independent reset controls.

Blank mileage days are available for automatic distribution. An explicit zero is a rest day. Splits use even pace; a race that does not divide evenly into laps starts with a partial lap to the first finish-line crossing.

## Publishing

Pushes to `main` run calculation and browser tests, build the app, and deploy `dist/` through GitHub Actions. The independent Pages deployment lives at `https://pseigne.github.io/running-utilities/`. Since `pierceseigne.com` belongs to the portfolio project rather than an account-level Pages site, the portfolio deployment also builds this public repository into its `/running-utilities/` folder. It checks for new running-tool commits every 20 minutes and deploys when needed. This project does not set its own CNAME or change the portfolio domain.

The original `weekly-mileage-planner` and `track-split-calculator` checkouts, with their Git histories, are preserved locally in `Developer/_archives/running-utilities`. Their GitHub repositories remain intact. This combined app is an independent repository.
