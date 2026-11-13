import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const shownTool = page => page.locator('main > section[data-tool]:not([hidden])')

test('the switch, direct links, and browser history pick the tool', async ({ page }) => {
  await page.goto('')
  await expect(shownTool(page)).toHaveAttribute('data-tool', 'weekly-mileage')
  await expect(page).toHaveTitle('Weekly Mileage Planner · Running Utilities')

  await page.getByRole('link', { name: 'Splits' }).click()
  await expect(page).toHaveURL(/#track-splits$/)
  await expect(shownTool(page)).toHaveAttribute('data-tool', 'track-splits')
  await expect(page.getByRole('link', { name: 'Splits' })).toHaveAttribute('aria-current', 'page')
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
  await expect(page.getByRole('heading', { level: 1, name: 'Track Split Calculator' })).toBeFocused()
  await expect(page).toHaveURL(/#track-splits$/)
})

test('the nav is pinned, measured, and sits on the ground', async ({ page }) => {
  await page.goto('')
  const nav = page.locator('header.top')
  await expect(nav).toHaveCSS('position', 'sticky')
  await expect(nav).toHaveCSS('background-color', 'rgb(18, 18, 18)')
  const head = await page.evaluate(() => document.documentElement.style.getPropertyValue('--head'))
  expect(parseFloat(head)).toBe(await nav.evaluate(el => el.offsetHeight))
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(18, 18, 18)')
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
  await tool.getByRole('textbox', { name: 'Goal mileage' }).fill('50')
  await tool.getByRole('textbox', { name: 'Monday', exact: true }).fill('20')
  await expect(tool.locator('.num')).toHaveText('30mi')
  await tool.getByRole('button', { name: 'Distribute remaining mileage' }).click()
  await expect(tool.getByRole('textbox', { name: 'Tuesday' })).toHaveValue('5')
  await expect(tool.locator('.num')).toHaveText('0mi')
  await page.getByRole('link', { name: 'Splits' }).click()
  await page.getByRole('link', { name: 'Mileage' }).click()
  await expect(tool.getByRole('textbox', { name: 'Monday', exact: true })).toHaveValue('20')
  await expect(tool.getByRole('textbox', { name: 'Sunday' })).toHaveValue('5')
})

test('mileage: the lanes fill with what’s run, the same column on a phone and a desktop', async ({ page }) => {
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('#weekly-mileage')
    await page.reload()
    const tool = shownTool(page)
    await tool.getByRole('textbox', { name: 'Goal mileage' }).fill('40')
    await tool.getByRole('textbox', { name: 'Monday', exact: true }).fill('10')
    await expect(tool.locator('.num')).toHaveText('30mi')
    await expect(tool.locator('.lane-run')).toHaveCount(1)
    await expect(tool.locator('.lane-finish')).toBeVisible()
    // one phone-wide column
    expect((await tool.locator('.mileage').boundingBox()).width).toBeLessThanOrEqual(420)
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
      await tool.getByRole('textbox', { name: 'Goal mileage' }).fill('50')
      await tool.getByRole('textbox', { name: 'Monday', exact: true }).fill('6')
      await tool.getByRole('textbox', { name: 'Tuesday' }).fill('8')
      await tool.getByRole('textbox', { name: 'Thursday' }).fill('10')
      await tool.getByRole('button', { name: 'Distribute remaining mileage' }).click()
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

test('splits: the time fits on a phone, with every lap in the table', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto('#track-splits')
  const tool = shownTool(page)
  await tool.getByRole('textbox', { name: 'Hours' }).fill('1')
  await tool.getByRole('textbox', { name: 'Minutes' }).fill('02')
  await tool.getByRole('textbox', { name: 'Seconds' }).fill('03.45')
  // the time and every race are on show, none off the edge
  const column = await tool.locator('.splits').boundingBox()
  const group = await tool.getByRole('group', { name: 'Target time' }).boundingBox()
  expect(group.x + group.width).toBeLessThanOrEqual(column.x + column.width)
  for (const race of await tool.locator('.wrapping label').all()) {
    const box = await race.boundingBox()
    expect(box.x + box.width).toBeLessThanOrEqual(column.x + column.width)
  }
  await tool.getByRole('radio', { name: '10,000 m' }).check({ force: true })
  await expect(tool.locator('tbody tr[data-row]')).toHaveCount(25)
  await expect(tool.locator('tbody tr[data-row]').last().locator('td').last()).toHaveText('1:02:03.45')
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
  await expect(page.locator('.field[data-invalid] .field-box')).toHaveCSS('border-top-color', 'rgb(255, 122, 87)')
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

test('with reduced motion, nothing animates', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('#weekly-mileage')
  const tool = shownTool(page)
  await tool.getByRole('textbox', { name: 'Goal mileage' }).fill('30')
  await tool.getByRole('textbox', { name: 'Monday', exact: true }).fill('10')
  const durations = await page.evaluate(() => [...document.querySelectorAll('.lane-run, .lane-finish, .day .field-box, .press')]
    .filter(el => el.checkVisibility())
    .map(el => getComputedStyle(el).transitionDuration))
  expect(durations.length).toBeGreaterThan(0)
  expect(new Set(durations.flatMap(d => d.split(', ')))).toEqual(new Set(['0s']))
})

for (const colorScheme of ['light', 'dark']) {
  test(`no accessibility violations with both tools filled in, ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('#weekly-mileage')
    let tool = shownTool(page)
    await tool.getByRole('textbox', { name: 'Goal mileage' }).fill('40')
    await tool.getByRole('textbox', { name: 'Monday', exact: true }).fill('8')
    await tool.getByRole('textbox', { name: 'Tuesday' }).fill('x')
    await tool.getByRole('button', { name: 'Distribute remaining mileage' }).click()
    let results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([])
    await page.getByRole('link', { name: 'Splits' }).click()
    tool = shownTool(page)
    await tool.getByRole('textbox', { name: 'Minutes' }).fill('15')
    await tool.getByRole('radio', { name: '5000 m' }).check({ force: true })
    await tool.getByRole('radio', { name: 'Other' }).last().check({ force: true })
    await tool.getByRole('textbox', { name: 'Track length' }).fill('300')
    results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([])
  })
}

test('the page wears the watch face', async ({ page }) => {
  // colours are read straight after typing, so nothing may still be on its way
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('#track-splits')
  const tool = shownTool(page)
  await tool.getByRole('textbox', { name: 'Minutes' }).fill('4')
  const style = (selector, property) => page.locator(selector).first().evaluate((el, p) => getComputedStyle(el)[p], property)
  expect(await style('html', 'fontFamily')).toMatch(/^Archivo/)
  expect(await style('html', 'fontVariantNumeric')).toBe('tabular-nums')
  expect(await style('html', 'backgroundColor')).toBe('rgb(18, 18, 18)')
  // the current pill is paper with dark words
  expect(await style('[data-tool="track-splits"] .pills label:has(input:checked)', 'backgroundColor')).toBe('rgb(244, 242, 238)')
  expect(await style('[data-tool="track-splits"] .pills label:has(input:checked)', 'color')).toBe('rgb(18, 18, 18)')
  expect(await style('header .pills [aria-current]', 'backgroundColor')).toBe('rgb(244, 242, 238)')
  expect(await style('header .pills [aria-current]', 'color')).toBe('rgb(18, 18, 18)')
  // and keeps its dark words under the pointer
  await page.locator('header .pills [aria-current]').hover()
  expect(await style('header .pills [aria-current]', 'color')).toBe('rgb(18, 18, 18)')
  await page.getByRole('link', { name: 'Mileage' }).click()
  const mileage = shownTool(page)
  await mileage.getByRole('textbox', { name: 'Goal mileage' }).fill('35')
  await mileage.getByRole('textbox', { name: 'Monday', exact: true }).fill('5')
  expect(await style('[data-tool="weekly-mileage"] .lane-run', 'backgroundColor')).toBe('rgb(255, 122, 87)')
  expect(await style('[data-tool="weekly-mileage"] .day.run .field-box', 'backgroundColor')).toBe('rgb(255, 122, 87)')
})
