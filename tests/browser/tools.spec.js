import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const shownTool = page => page.locator('main > section[data-tool]:not([hidden])')

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
  for (const tool of ['weekly-mileage', 'track-splits']) {
    await page.goto(`#${tool}`)
    // a field's target is its box; only what's on show counts, as the other tool's targets are hidden
    const small = await page.evaluate(() => [...document.querySelectorAll('a, button, .pills label, .field-box')]
      .filter(el => el.checkVisibility())
      .filter(el => {
        // a pill's ::after reaches 4px above and below it
        const height = el.getBoundingClientRect().height
        const reach = getComputedStyle(el, '::after').content === 'none' ? height : height + 8
        return reach < 44
      })
      .map(el => el.textContent || el.getAttribute('aria-label') || el.id))
    expect(small, tool).toEqual([])
  }
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

test('mileage: 50 with 20 on Monday spreads 5 a day, and survives a trip to the other tool', async ({ page }) => {
  await page.goto('#weekly-mileage')
  const tool = shownTool(page)
  await tool.getByRole('textbox', { name: 'Weekly goal' }).fill('50')
  await tool.getByRole('textbox', { name: 'Monday', exact: true }).fill('20')
  await expect(tool.locator('.num')).toHaveText('30mi to go')
  await tool.getByRole('button', { name: 'Spread the rest over open days' }).click()
  await expect(tool.getByRole('textbox', { name: 'Tuesday' })).toHaveValue('5')
  await expect(tool.locator('.lead')).toHaveText('50 of 50 miles planned. The week is on target.')
  await page.getByRole('link', { name: 'Track splits' }).click()
  await page.getByRole('link', { name: 'Weekly mileage' }).click()
  await expect(tool.getByRole('textbox', { name: 'Monday', exact: true })).toHaveValue('20')
  await expect(tool.getByRole('textbox', { name: 'Sunday' })).toHaveValue('5')
})

test('mileage: the week draws at its real width, with the line at the daily average', async ({ page }) => {
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('#weekly-mileage')
    const tool = shownTool(page)
    await tool.getByRole('textbox', { name: 'Weekly goal' }).fill('35')
    await tool.getByRole('textbox', { name: 'Monday', exact: true }).fill('10')
    const svg = tool.locator('.trackcard svg')
    // it measures itself after a resize, a frame later
    await expect.poll(async () => Math.abs(Number(await svg.getAttribute('width')) - (await svg.boundingBox()).width)).toBeLessThan(1)
    // labels stay 14px however wide the card is
    expect(await svg.locator('text').first().evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(12)
    await expect(svg.locator('text', { hasText: '5 a day makes 35' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

for (const colorScheme of ['light', 'dark']) {
  test(`mileage looks right filled in, ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('#weekly-mileage')
      // the same hash doesn't reload, so start each width from an empty week
      await page.reload()
      const tool = shownTool(page)
      await tool.getByRole('textbox', { name: 'Weekly goal' }).fill('50')
      await tool.getByRole('textbox', { name: 'Monday', exact: true }).fill('6')
      await tool.getByRole('textbox', { name: 'Tuesday' }).fill('8')
      await tool.getByRole('textbox', { name: 'Thursday' }).fill('10')
      await tool.getByRole('button', { name: 'Spread the rest over open days' }).click()
      await tool.getByRole('textbox', { name: 'Saturday' }).fill('12')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      // a full-page shot taken scrolled down draws the pinned nav mid-page
      await page.evaluate(() => { document.activeElement.blur(); scrollTo(0, 0) })
      await page.screenshot({ path: `test-results/mileage-${colorScheme}-${width}.png`, fullPage: true })
    }
  })
}

test('splits: an 800 in 2:00 is two laps, picked from the keyboard', async ({ page }) => {
  await page.goto('#track-splits')
  const tool = shownTool(page)
  await tool.getByRole('textbox', { name: 'Minutes' }).fill('2')
  // radios: Tab reaches the checked one, arrows move the choice
  await tool.getByRole('radio', { name: 'Mile' }).focus()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await expect(tool.getByRole('radio', { name: '800 m' })).toBeChecked()
  await expect(tool.locator('.pills label:has(input:focus-visible)')).toHaveCount(1)
  await expect(tool.locator('tbody tr[data-row]')).toHaveCount(2)
  await expect(tool.locator('tbody tr[data-row]').last().locator('td').last()).toHaveText('2:00.00')
})

test('splits: the time fits on a phone and the strip draws at its real width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto('#track-splits')
  const tool = shownTool(page)
  await tool.getByRole('textbox', { name: 'Hours' }).fill('1')
  await tool.getByRole('textbox', { name: 'Minutes' }).fill('02')
  await tool.getByRole('textbox', { name: 'Seconds' }).fill('03.45')
  await tool.getByRole('radio', { name: '10,000 m' }).check({ force: true })
  const card = await tool.locator('.herocard').boundingBox()
  const group = await tool.getByRole('group', { name: 'Goal time' }).boundingBox()
  expect(group.x + group.width).toBeLessThanOrEqual(card.x + card.width)
  const svg = tool.locator('.trackcard svg')
  await expect.poll(async () => Math.abs(Number(await svg.getAttribute('width')) - (await svg.boundingBox()).width)).toBeLessThan(1)
  await expect(svg.locator('text', { hasText: '1:02:03.45' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

for (const colorScheme of ['light', 'dark']) {
  test(`splits looks right filled in, ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('#track-splits')
      await page.reload()
      const tool = shownTool(page)
      await tool.getByRole('textbox', { name: 'Minutes' }).fill('4')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.evaluate(() => { document.activeElement.blur(); scrollTo(0, 0) })
      await page.screenshot({ path: `test-results/splits-${colorScheme}-${width}.png`, fullPage: true })
    }
  })
}

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
  for (const box of await page.locator('[data-tool="kit"] .field-box').all()) {
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
