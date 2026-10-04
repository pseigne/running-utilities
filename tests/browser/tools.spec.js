import { test, expect } from '@playwright/test';

test('mileage distribution, rest days, switching and persisted inputs', async ({ page }) => {
  await page.goto('');
  await page.getByLabel('Weekly goal').fill('50');
  await page.getByLabel('Monday mileage').fill('20');
  await page.getByLabel('Tuesday mileage').fill('0');
  await page.getByRole('button', { name: 'Distribute remaining miles' }).click();
  await expect(page.getByLabel('Wednesday mileage')).toHaveValue('6');
  await expect(page.getByLabel('Tuesday mileage')).toHaveValue('0');
  await expect(page.locator('#remaining-total')).toHaveText('0');
  await page.getByRole('link', { name: 'Track Splits', exact: true }).click();
  await page.getByLabel('Minutes', { exact: true }).fill('2');
  await expect(page.locator('#split-rows tr')).toHaveCount(2);
  await expect(page.locator('#split-rows tr').last().locator('td').last()).toHaveText('2:00.00');
  await page.goBack();
  await expect(page.getByLabel('Weekly goal')).toHaveValue('50');
  await page.reload();
  await expect(page.getByLabel('Monday mileage')).toHaveValue('20');
  await page.getByRole('button', { name: 'Reset week' }).click();
  await expect(page.getByLabel('Monday mileage')).toHaveValue('');
});

test('direct links, custom inputs, invalid results, reset and theme', async ({ page }) => {
  await page.goto('#track-splits');
  await expect(page.locator('#track-splits')).toBeVisible();
  await page.getByLabel('Minutes', { exact: true }).fill('4');
  await page.getByLabel('1500m', { exact: true }).check();
  await expect(page.locator('#split-rows tr')).toHaveCount(4);
  await expect(page.locator('#split-rows tr').first().locator('td').nth(1)).toHaveText('300m');
  await page.locator('input[name="track"][value="custom"]').check();
  await expect(page.locator('#split-table-wrap')).toBeHidden();
  await page.getByLabel('Custom track length').fill('300');
  await expect(page.locator('#split-rows tr')).toHaveCount(5);
  await page.getByLabel('Custom track length').fill('0');
  await expect(page.locator('#split-table-wrap')).toBeHidden();
  await expect(page.locator('#custom-track')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Reset splits' }).click();
  await expect(page.locator('#split-empty')).toBeVisible();
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('mobile and desktop have no horizontal overflow or console errors', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['#weekly-mileage', '#track-splits']) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/${width}-${route.slice(1)}.png`, fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});
