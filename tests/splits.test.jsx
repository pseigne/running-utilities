import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import SplitCalculator from '../src/tools/splits/SplitCalculator'

afterEach(cleanup)

const type = (name, value) => fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } })
const choose = (name, group = 'Race distance') => fireEvent.click(within(screen.getByRole('group', { name: group })).getByRole('radio', { name }))
// metres keep their unit on the same line with a non-breaking space; compare with plain ones
const plain = text => text.replace(/\u00a0/g, ' ')
const lead = () => plain(document.querySelector('.lead').textContent)
const rows = () => [...document.querySelectorAll('tbody tr[data-row]')].map(row => [...row.cells].map(cell => plain(cell.textContent)))

describe('the split calculator', () => {
  it('starts on the mile and a 400, asking for a time', () => {
    render(<SplitCalculator />)
    expect(screen.getByRole('heading', { level: 1, name: 'Track splits' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Goal time' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Mile' }).checked).toBe(true)
    expect(screen.getByRole('radio', { name: '400 m' }).checked).toBe(true)
    expect(lead()).toBe('Enter a goal time to see the split for every lap.')
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByRole('figure')).toBeNull()
  })

  it('keeps the old example: an 800 in 2:00 is two laps ending at 2:00.00', () => {
    render(<SplitCalculator />)
    type('Minutes', '2')
    choose('800 m')
    expect(rows()).toEqual([['1', '400 m', '60.00', '1:00.00'], ['2', '800 m', '60.00', '2:00.00']])
    expect(lead()).toBe('A 2:00.00 800 m is 60.00 a lap on a 400 m track.')
    expect(plain(document.querySelector('.finish').textContent)).toBe('Finish · 800 m2:00.00')
  })

  it('gives a 4:00 mile its 9 m start, its laps, and its paces', () => {
    render(<SplitCalculator />)
    type('Minutes', '4')
    expect(lead()).toBe('A 4:00.00 mile is 59.65 a lap on a 400 m track.')
    expect(rows()[0]).toEqual(['Start', '9 m', '1.399 m', '0:01.39'])
    expect(rows().at(-1)).toEqual(['4', '1,609 m', '59.65', '4:00.00'])
    expect(screen.getByRole('table', { name: 'Splits for a 4:00.00 mile on a 400\u00a0m track' })).toBeTruthy()
    expect(plain(document.querySelector('.details').textContent)).toContain('2:29.13 for each kilometre.')
    expect(plain(document.querySelector('.details').textContent)).toContain('4:00.00 for each mile.')
    expect(plain(document.querySelector('.details').textContent)).not.toContain('400 m')
    expect(plain(document.querySelector('figcaption').textContent)).toContain('The start is 9 m round from the line')
  })

  it('switches tracks and adds the per-400 card off a 400', () => {
    render(<SplitCalculator />)
    type('Minutes', '4')
    choose('200 m', 'Track length')
    expect(lead()).toBe('A 4:00.00 mile is 29.83 a lap on a 200 m track.')
    expect(plain(document.querySelector('.details').textContent)).toContain('59.65 for each 400 m.')
  })

  it('takes Other distances and tracks, asking for metres until they are valid', () => {
    render(<SplitCalculator />)
    type('Minutes', '3')
    choose('Other')
    expect(screen.getAllByRole('radio', { name: 'Other' })[0].checked).toBe(true)
    expect(lead()).toBe('Enter the race distance in metres.')
    type('Race distance', 'far')
    expect(screen.getByText('Enter metres as a number, like 1200.')).toBeTruthy()
    type('Race distance', '1200')
    expect(rows()).toHaveLength(3)
    choose('Other', 'Track length')
    expect(lead()).toBe('Enter the track length in metres.')
    type('Track length', '300')
    expect(rows().map(row => row[1])).toEqual(['300 m', '600 m', '900 m', '1,200 m'])
  })

  it('lets a preset chosen after Other win', () => {
    render(<SplitCalculator />)
    type('Minutes', '2')
    choose('Other')
    type('Race distance', '1200')
    choose('800 m')
    expect(screen.queryByRole('textbox', { name: 'Race distance' })).toBeNull()
    expect(rows()).toHaveLength(2)
  })

  it('rolls minutes over 59 into the time and says so', () => {
    render(<SplitCalculator />)
    choose('10,000 m')
    type('Minutes', '75')
    expect(lead()).toBe('Read as 1:15:00.00. A 1:15:00.00 10,000 m is 3:00.00 a lap on a 400 m track.')
  })

  it('explains a time that isn’t numbers, and a race with too many laps', () => {
    render(<SplitCalculator />)
    type('Seconds', 'abc')
    expect(screen.getByRole('textbox', { name: 'Seconds' }).getAttribute('aria-invalid')).toBe('true')
    expect(lead()).toBe('Enter the time as numbers: whole hours and minutes, and seconds with up to two decimals.')
    type('Seconds', '30')
    choose('Other', 'Track length')
    type('Track length', '1')
    choose('10,000 m')
    expect(lead()).toBe('That’s more than 200 laps. Check the race distance and the track length.')
    expect(screen.queryByRole('table')).toBeNull()
  })
})
