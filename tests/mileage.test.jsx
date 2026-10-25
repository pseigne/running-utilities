import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MileagePlanner from '../src/tools/mileage/MileagePlanner'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const type = (name, value) => fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } })
const number = () => document.querySelector('.num').textContent
const lead = () => document.querySelector('.lead').textContent
const line = () => document.querySelector('.finish').textContent
// the board's note under each day: its spread mark or the week so far
const notes = () => [...document.querySelectorAll('.board-note')].map(note => note.textContent)
const spreadButton = () => screen.getByRole('button', { name: 'Spread the rest over open days' })

describe('the mileage planner', () => {
  it('starts by asking for a goal', () => {
    render(<MileagePlanner />)
    expect(screen.getByRole('heading', { level: 1, name: 'Weekly mileage' })).toBeTruthy()
    expect(number()).toBe('0mi planned')
    expect(lead()).toBe('Set a weekly goal to see what’s left.')
    expect(spreadButton().disabled).toBe(true)
    expect(screen.getByText('Set a goal to spread what’s left over the open days.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Clear the week' }).disabled).toBe(true)
    expect(screen.getAllByRole('textbox')).toHaveLength(8)
    expect(document.querySelectorAll('.board-day')).toHaveLength(7)
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('keeps the old example: a 50 goal and 20 on Monday leave 30, 5 a day', () => {
    render(<MileagePlanner />)
    type('Weekly goal', '50')
    type('Monday', '20')
    expect(number()).toBe('30mi to go')
    expect(lead()).toBe('20 of 50 miles planned. 30 to go across 6 open days, about 5 a day.')
    fireEvent.click(spreadButton())
    expect(screen.getByRole('textbox', { name: 'Tuesday' }).value).toBe('5')
    expect(screen.getByRole('textbox', { name: 'Sunday' }).value).toBe('5')
    expect(notes()).toEqual(['20 so far', 'spread', 'spread', 'spread', 'spread', 'spread', 'spread'])
    expect(screen.getByRole('status').textContent).toBe('Spread 30 miles over 6 days.')
    expect(number()).toBe('0mi to go')
    expect(lead()).toBe('50 of 50 miles planned. The week is on target.')
    expect(spreadButton().disabled).toBe(true)
    expect(document.querySelector('.note')).toBeNull()
  })

  it('notes the week so far under each day that has miles', () => {
    render(<MileagePlanner />)
    type('Monday', '6')
    type('Wednesday', '4.5')
    expect(notes()).toEqual(['6 so far', '', '10.5 so far', '', '', '', ''])
    expect(number()).toBe('10.5mi planned')
    expect(lead()).toBe('10.5 miles planned so far. Set a weekly goal to see what’s left.')
  })

  it('stops calling a day spread once it is typed over', () => {
    render(<MileagePlanner />)
    type('Weekly goal', '14')
    fireEvent.click(spreadButton())
    expect(screen.getByRole('textbox', { name: 'Monday' }).value).toBe('2')
    type('Monday', '4')
    const monday = screen.getByRole('textbox', { name: 'Monday' }).closest('.board-day')
    expect(within(monday).queryByText('spread')).toBeNull()
    expect(notes().filter(note => note === 'spread')).toHaveLength(6)
    expect(lead()).toBe('16 miles planned, 2 over your 14\u2011mile goal.')
    expect(number()).toBe('2mi over')
  })

  it('says when every day is filled but the goal is short', () => {
    render(<MileagePlanner />)
    type('Weekly goal', '50')
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) type(day, '7')
    expect(lead()).toBe('49 of 50 miles planned, with every day filled. Add 1 to a day to reach the goal.')
    expect(screen.getByText('Every day has miles. Clear one to spread onto it.')).toBeTruthy()
  })

  it('explains a goal or a day that isn’t a number, and never shows NaN', () => {
    render(<MileagePlanner />)
    type('Weekly goal', 'fifty')
    expect(screen.getByRole('textbox', { name: 'Weekly goal' }).getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Enter the goal as a number of miles.')).toBeTruthy()
    type('Tuesday', 'x')
    expect(screen.getByRole('textbox', { name: 'Tuesday' }).getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Enter a number of miles.')).toBeTruthy()
    expect(document.body.textContent).not.toContain('NaN')
  })

  it('clears the days and keeps the goal', () => {
    render(<MileagePlanner />)
    type('Weekly goal', '30')
    type('Friday', '10')
    fireEvent.click(screen.getByRole('button', { name: 'Clear the week' }))
    expect(screen.getByRole('textbox', { name: 'Friday' }).value).toBe('')
    expect(screen.getByRole('textbox', { name: 'Weekly goal' }).value).toBe('30')
    expect(screen.getByRole('status').textContent).toBe('Cleared the week.')
  })

  it('draws the line on the track only once there is a goal', () => {
    render(<MileagePlanner />)
    expect(document.querySelector('.trackcard .the-line')).toBeNull()
    expect(screen.getByRole('figure', { name: 'The week' })).toBeTruthy()
    type('Weekly goal', '35')
    expect(document.querySelector('.trackcard .the-line')).toBeTruthy()
    expect(document.querySelector('.trackcard').textContent).toContain('5 a day makes 35')
    expect(document.querySelector('figcaption').textContent).toContain('The black line is 5 miles, the daily average that makes 35.')
  })
})

describe('the mileage planner on a phone', () => {
  // phones list the days in a table with the goal's line under it, instead of the board
  const phone = () => vi.stubGlobal('matchMedia', query => ({
    matches: query.includes('max-width: 720px'), addEventListener() {}, removeEventListener() {},
  }))

  it('lists the days with a running total and the goal’s line', () => {
    phone()
    render(<MileagePlanner />)
    expect(document.querySelector('.board')).toBeNull()
    expect(line()).toBe('No goal yet')
    type('Tuesday', '6')
    expect(document.querySelector('tbody tr[data-row]').cells[2].textContent).toBe('–')
    expect(document.querySelectorAll('tbody tr[data-row]')[1].cells[2].textContent).toBe('6 so far')
    type('Tuesday', '')
    type('Weekly goal', '50')
    type('Monday', '20')
    expect(line()).toBe('Goal · 30 mi to go50 mi')
    type('Wednesday', '4.5')
    const totals = [...document.querySelectorAll('tbody tr[data-row]')].map(row => row.cells[2].textContent)
    expect(totals).toEqual(['20 so far', '20 so far', '24.5 so far', '24.5 so far', '24.5 so far', '24.5 so far', '24.5 so far'])
    fireEvent.click(spreadButton())
    expect(document.querySelectorAll('.tag')).toHaveLength(5)
    expect(line()).toBe('Goal reached50 mi')
  })
})
