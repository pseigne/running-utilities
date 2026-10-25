import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const shownTool = page => page.locator('main section:not([hidden])')

test('the switch, direct links, and browser history pick the tool', async ({ page }) => {
  await page.goto('')
  await expect(shownTool(page)).toHaveAttribute('data-tool', 'weekly-mileage')
  await expect(page).toHaveTitle('Weekly Mileage Planner · Running Utilities')

  await page.getByRole('link', { name: 'Track splits' }).click()
  await expect(page).toHaveURL(/#track-splits$/)
  await expect(shownTool(page)).toHaveAttribute('data-tool', 'track-splits')
  await expect(page.getByRole('link', { name: 'Track splits' })).toHaveAttribute('aria-current', 'page')
  await expect(page).toHaveTitle('Track Split Calculator · Running Utilities')

  await page.goBack()
  await expect(shownTool(page)).toHaveAttribute('data-tool', 'weekly-mileage')
  await page.goForward()
  await expect(shownTool(page)).toHaveAttribute('data-tool', 'track-splits')

  await page.goto('#weekly-mileage')
  await expect(shownTool(page)).toHaveAttribute('data-tool', 'weekly-mileage')
})

test('the skip link is the first stop and lands on the tool’s heading', async ({ page }) => {
  await page.goto('#track-splits')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to the tool' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Track splits' })).toBeFocused()
  await expect(page).toHaveURL(/#track-splits$/)
})

test('the nav is pinned, measured, and sits on the track’s curb', async ({ page }) => {
  await page.goto('')
  const nav = page.locator('header.top')
  await expect(nav).toHaveCSS('position', 'sticky')
  await expect(nav).toHaveCSS('background-color', 'rgb(21, 21, 21)')
  expect(await nav.evaluate(el => getComputedStyle(el).boxShadow)).toContain('rgb(196, 83, 47)')
  const head = await page.evaluate(() => document.documentElement.style.getPropertyValue('--head'))
  expect(parseFloat(head)).toBe(await nav.evaluate(el => el.offsetHeight))
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(237, 235, 230)')
})

test('every target is at least 44px tall', async ({ page }) => {
  await page.goto('')
  const small = await page.evaluate(() => [...document.querySelectorAll('header a, .pills a, .pills label')]
    .filter(el => {
      // a pill's ::after reaches 4px above and below it
      const height = el.getBoundingClientRect().height
      const reach = getComputedStyle(el, '::after').content === 'none' ? height : height + 8
      return reach < 44
    })
    .map(el => el.textContent))
  expect(small).toEqual([])
})

test('phone, tablet, and desktop render without errors or sideways scrolling', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const tool of ['weekly-mileage', 'track-splits']) {
      await page.goto(`#${tool}`)
      await expect(shownTool(page).getByRole('heading', { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: `test-results/${width}-${tool}.png`, fullPage: true })
    }
  }
  expect(errors).toEqual([])
})

test('the kit gallery lays out at every width', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme })
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('#kit')
      await expect(page.getByRole('heading', { level: 1, name: 'Kit' })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: `test-results/kit-${colorScheme}-${width}.png`, fullPage: true })
    }
  }
  expect(errors).toEqual([])
})

test('kit tables turn into grids on phones and keep their heads on wider screens', async ({ page }) => {
  await page.goto('#kit')
  const table = page.getByRole('table', { name: 'Lap splits for a 4:00 mile' })
  await expect(table.locator('thead')).toBeVisible()
  await expect(table.locator('tbody tr[data-row]').first()).toHaveCSS('display', 'table-row')
  await page.setViewportSize({ width: 375, height: 900 })
  await expect(table.locator('thead')).toBeHidden()
  await expect(table.locator('tbody tr[data-row]').first()).toHaveCSS('display', 'grid')
  await expect(table.locator('.finish')).toBeVisible()
})

test('kit fields are 44px to tap and mark a wrong value in the line’s red', async ({ page }) => {
  await page.goto('#kit')
  for (const box of await page.locator('.field-box').all()) {
    expect((await box.boundingBox()).height).toBeGreaterThanOrEqual(44)
  }
  const wrong = page.getByRole('textbox', { name: 'Wed' })
  await expect(wrong).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('.field[data-invalid] .field-box')).toHaveCSS('border-top-color', 'rgb(196, 54, 27)')
  await wrong.fill('7')
  await expect(wrong).not.toHaveAttribute('aria-invalid')
})

for (const colorScheme of ['light', 'dark']) {
  test(`no accessibility violations in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    for (const tool of ['weekly-mileage', 'track-splits', 'kit']) {
      await page.goto(`#${tool}`)
      // the gallery loads lazily: wait for the shown tool's heading before checking
      await shownTool(page).getByRole('heading', { level: 1 }).first().waitFor()
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([])
    }
  })
}
