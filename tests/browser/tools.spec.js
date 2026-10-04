import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

test.beforeEach(async ({ page }) => {
  // Production files stay unchanged; provide the original CDN dependency locally in tests.
  await page.route('https://cdn.jsdelivr.net/npm/chart.js', route => route.fulfill({ path: fileURLToPath(new URL('../../node_modules/chart.js/dist/chart.umd.js', import.meta.url)), contentType: 'application/javascript' }));
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
});

test('original tools calculate and retain inputs when switching tabs', async ({ page }) => {
  await page.goto('');
  const mileage = page.frameLocator('iframe[title="Weekly Mileage Planner"]');
  await expect(mileage.getByRole('heading', { name: 'Weekly Mileage Planner', exact: true })).toBeVisible();
  await mileage.locator('#goal-mileage').fill('50');
  await mileage.locator('#Monday').fill('20');
  await expect(mileage.locator('#remaining-mileage')).toHaveText('30');
  await mileage.getByRole('button', { name: 'Distribute Remaining Mileage' }).click();
  await expect(mileage.locator('#Tuesday')).toHaveValue('5');
  await page.getByRole('tab', { name: 'Track Split Calculator' }).click();
  const splits = page.frameLocator('iframe[title="Track Split Calculator"]');
  await splits.getByLabel('Minutes', { exact: true }).fill('2');
  await splits.getByText('800m', { exact: true }).click();
  await expect(splits.locator('#result tbody tr')).toHaveCount(2);
  await expect(splits.locator('#result tbody tr').last().locator('td').last()).toHaveText('2:00.00');
  await page.getByRole('tab', { name: 'Weekly Mileage Planner' }).click();
  await expect(mileage.locator('#Monday')).toHaveValue('20');
  await expect(mileage.locator('#Tuesday')).toHaveValue('5');
  await page.getByRole('tab', { name: 'Track Split Calculator' }).click();
  await expect(splits.locator('#goal_minutes')).toHaveValue('2');
});

test('direct links, browser history, keyboard tabs, and original mileage theme', async ({ page }) => {
  await page.goto('#track-splits');
  await expect(page.getByRole('tab', { name: 'Track Split Calculator' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Weekly Mileage Planner' }).click();
  await page.goBack();
  await expect(page.locator('#track-splits')).toBeVisible();
  await page.getByRole('tab', { name: 'Track Split Calculator' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Weekly Mileage Planner' })).toBeFocused();
  const mileage = page.frameLocator('iframe[title="Weekly Mileage Planner"]');
  await mileage.locator('#Monday').waitFor();
  await mileage.locator('#theme-toggle').click();
  await expect(mileage.locator('body')).toHaveClass('dark');
  await expect(mileage.locator('#theme-toggle')).toHaveText('☀️');
});

test('original desktop and mobile views render without browser errors', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('');
    for (const [tool, title] of [['weekly-mileage', 'Weekly Mileage Planner'], ['track-splits', 'Track Split Calculator']]) {
      await page.getByRole('tab', { name: title }).click();
      const frame = page.frameLocator(`iframe[title="${title}"]`);
      await expect(frame.getByRole('heading', { name: title, exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/${width}-${tool}.png`, fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});
