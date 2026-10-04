import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4387/running-utilities/', browserName: 'chromium', colorScheme: 'light' },
  webServer: { command: 'npm run dev -- --port 4387 --strictPort', url: 'http://127.0.0.1:4387/running-utilities/', reuseExistingServer: false },
});
