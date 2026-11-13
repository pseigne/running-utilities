import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import SplitCalculator from '../src/tools/splits/SplitCalculator'

afterEach(cleanup)

const type = (name, value) => fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } })
const choose = (name, group = 'Race distance') => fireEvent.click(within(screen.getByRole('group', { name: group })).getByRole('radio', { name }))
// metres keep their unit on the same line with a non-breaking space; compare with plain ones
const plain = text => text.replace(/\u00a0/g, ' ')
const lead = () => document.querySelector('.lead')?.textContent ?? null
const rows = () => [...document.querySelectorAll('tbody tr[data-row]')].map(row => [...row.cells].map(cell => plain(cell.textContent)))

describe('the split calculator', () => {
  it('lays out the original: the time, the race and the track down one card, the table under it', () => {
    render(<SplitCalculator />)
    type('Minutes', '4')
    const card = document.querySelector('.splits-card')
    expect([...card.querySelectorAll('h1, h2, .ask-small')].map(heading => heading.textContent))
      .toEqual(['Track Split Calculator', 'Target time', 'Race distance', 'Track length'])
    expect([...card.querySelectorAll('.timefield label')].map(label => label.textContent)).toEqual(['Hours', 'Minutes', 'Seconds'])
    expect(card.nextElementSibling.querySelector('table')).toBeTruthy()
    expect(screen.getAllByRole('columnheader').map(th => th.textContent)).toEqual(['Lap', 'Distance', 'Split', 'Cumulative'])
  })

  it('starts on the mile and a 400, with nothing to show', () => {
    render(<SplitCalculator />)
    expect(screen.getByRole('heading', { level: 1, name: 'Track Split Calculator' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Target time' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Mile' }).checked).toBe(true)
    expect(screen.getByRole('radio', { name: '400 m' }).checked).toBe(true)
    expect(lead()).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByRole('figure')).toBeNull()
  })

  it('keeps the old example: an 800 in 2:00 is two laps ending at 2:00.00', () => {
    render(<SplitCalculator />)
    type('Minutes', '2')
    choose('800 m')
    expect(rows()).toEqual([['1', '400 m', '60.00', '1:00.00'], ['2', '800 m', '60.00', '2:00.00']])
    expect(lead()).toBe('Scroll to see splits')
    expect(plain(document.querySelector('.finish').textContent)).toBe('Finish · 800 m2:00.00')
  })

  it('gives a 4:00 mile its 9 m start and its laps', () => {
    render(<SplitCalculator />)
    type('Minutes', '4')
    expect(lead()).toBe('Scroll to see splits')
    expect(rows()[0]).toEqual(['Start', '9 m', '1.399 m', '0:01.39'])
    expect(rows().at(-1)).toEqual(['4', '1,609 m', '59.65', '4:00.00'])
    expect(screen.getByRole('table', { name: 'Splits for a 4:00.00 mile on a 400\u00a0m track' })).toBeTruthy()
  })

  it('switches tracks', () => {
    render(<SplitCalculator />)
    type('Minutes', '4')
    choose('200 m', 'Track length')
    expect(lead()).toBe('Scroll to see splits')
    expect(rows()).toHaveLength(9)
  })

  it('takes Other distances and tracks once they are metres', () => {
    render(<SplitCalculator />)
    type('Minutes', '3')
    choose('Other')
    expect(screen.getAllByRole('radio', { name: 'Other' })[0].checked).toBe(true)
    expect(lead()).toBeNull()
    type('Custom distance', 'far')
    expect(screen.getByRole('textbox', { name: 'Custom distance' }).getAttribute('aria-invalid')).toBe('true')
    type('Custom distance', '1200')
    expect(rows()).toHaveLength(3)
    choose('Other', 'Track length')
    expect(lead()).toBeNull()
    type('Track length', '300')
    expect(rows().map(row => row[1])).toEqual(['300 m', '600 m', '900 m', '1,200 m'])
  })

  it('lets a preset chosen after Other win', () => {
    render(<SplitCalculator />)
    type('Minutes', '2')
    choose('Other')
    type('Custom distance', '1200')
    choose('800 m')
    expect(screen.queryByRole('textbox', { name: 'Custom distance' })).toBeNull()
    expect(rows()).toHaveLength(2)
  })

  it('rolls minutes over 59 into the time', () => {
    render(<SplitCalculator />)
    choose('10,000 m')
    type('Minutes', '75')
    expect(rows().at(-1).at(-1)).toBe('1:15:00.00')
  })

  it('marks a time that isn’t numbers, and shows nothing for a race with too many laps', () => {
    render(<SplitCalculator />)
    type('Seconds', 'abc')
    expect(screen.getByRole('textbox', { name: 'Seconds' }).getAttribute('aria-invalid')).toBe('true')
    expect(lead()).toBeNull()
    type('Seconds', '30')
    choose('Other', 'Track length')
    type('Track length', '1')
    choose('10,000 m')
    expect(lead()).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
