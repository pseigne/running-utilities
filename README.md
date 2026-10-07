# Running Utilities

The original **Weekly Mileage Planner** and **Track Split Calculator**, in two tabs at **https://pierceseigne.com/running-utilities/**.

Each tool keeps its original HTML, CSS, JavaScript, colors, layout, controls, and calculation behavior. A small tab bar switches between independent iframe pages, preserving their inputs while the page remains open. The original mileage planner retains its own theme toggle. Hash links (`#weekly-mileage` and `#track-splits`) support direct links and browser history. The tab page retargets the original footer links so the portfolio link opens at the top level and GitHub opens in a new tab, without editing the archived files.

The original projects' source files are copied without modification into `public/weekly-mileage` and `public/track-splits`. `original-sources.json` records their original commits and SHA-256 checksums; tests verify those files remain unchanged. Chart.js and Font Awesome load from the original CDN URLs. The local Chart.js dependency is only used to make browser tests independent of CDN availability.

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

Vite serves and builds under `/running-utilities/`. The original checkouts and their Git histories remain in `Developer/_archives/running-utilities`; their GitHub repositories are unchanged.

## Publishing

Pushes to `main` run source-integrity and browser tests, then build and publish to `https://pseigne.github.io/running-utilities/` through GitHub Actions.

The portfolio deployment includes this public repository's built files under `/running-utilities/` on `pierceseigne.com`. It checks for new commits once daily at 06:07 UTC and deploys when needed. A manual run of the portfolio deployment publishes immediately. This project does not set its own CNAME or change the portfolio domain.
