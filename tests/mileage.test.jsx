import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import MileagePlanner from '../src/tools/mileage/MileagePlanner'

afterEach(cleanup)

const type = (name, value) => fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } })
const number = () => document.querySelector('.num').textContent
const spreadButton = () => screen.getByRole('button', { name: 'Distribute remaining mileage' })
const note = () => document.querySelector('.inputs .note')?.textContent ?? null
const spreadDays = () => [...document.querySelectorAll('.day.spread input')].map(input => input.closest('.field').querySelector('label').textContent)

describe('the mileage planner', () => {
  it('lays out the original: title, chart, a field for each day, the goal, the button, what’s left', () => {
    render(<MileagePlanner />)
    expect(screen.getByRole('heading', { level: 1, name: 'Weekly Mileage Planner' })).toBeTruthy()
    const parts = [...document.querySelector('.mileage').children].map(part => part.className.split(' ').at(-1))
    expect(parts).toEqual(['tool-title', 'week', 'inputs', 'remaining'])
    expect([...document.querySelectorAll('.days label')].map(label => label.textContent))
      .toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    expect(screen.getByRole('textbox', { name: 'Goal mileage' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Remaining mileage' })).toBeTruthy()
  })

  it('starts by asking for a goal', () => {
    render(<MileagePlanner />)
    expect(number()).toBe('0mi planned')
    expect(spreadButton().disabled).toBe(true)
    expect(note()).toBe('Set a goal to spread what’s left over the open days.')
  })

  it('keeps the old example: a 50 goal and 20 on Monday leave 30, 5 a day', () => {
    render(<MileagePlanner />)
    type('Goal mileage', '50')
    type('Monday', '20')
    expect(number()).toBe('30mi to go')
    expect(note()).toBeNull()
    fireEvent.click(spreadButton())
    expect(screen.getByRole('textbox', { name: 'Tuesday' }).value).toBe('5')
    expect(screen.getByRole('textbox', { name: 'Sunday' }).value).toBe('5')
    expect(spreadDays()).toEqual(['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    expect(screen.getByRole('status').textContent).toBe('Spread 30 miles over 6 days.')
    expect(number()).toBe('0mi to go')
    expect(spreadButton().disabled).toBe(true)
    expect(note()).toBe('The week is on target.')
  })

  it('totals what’s planned before there is a goal', () => {
    render(<MileagePlanner />)
    type('Monday', '6')
    type('Wednesday', '4.5')
    expect(number()).toBe('10.5mi planned')
  })

  it('stops calling a day spread once it is typed over', () => {
    render(<MileagePlanner />)
    type('Goal mileage', '14')
    fireEvent.click(spreadButton())
    expect(screen.getByRole('textbox', { name: 'Monday' }).value).toBe('2')
    type('Monday', '4')
    expect(spreadDays()).not.toContain('Monday')
    expect(spreadDays()).toHaveLength(6)
    expect(number()).toBe('2mi over')
    expect(note()).toBe('The week is already over the goal.')
  })

  it('says when every day is filled but the goal is short', () => {
    render(<MileagePlanner />)
    type('Goal mileage', '50')
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) type(day, '7')
    expect(number()).toBe('1mi to go')
    expect(note()).toBe('Every day has miles. Clear one to spread onto it.')
  })

  it('explains a goal or a day that isn’t a number, and never shows NaN', () => {
    render(<MileagePlanner />)
    type('Goal mileage', 'fifty')
    expect(screen.getByRole('textbox', { name: 'Goal mileage' }).getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Enter the goal as a number of miles.')).toBeTruthy()
    type('Tuesday', 'x')
    expect(screen.getByRole('textbox', { name: 'Tuesday' }).getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Enter a number of miles.')).toBeTruthy()
    expect(document.body.textContent).not.toContain('NaN')
  })

  it('labels each bar and draws the line on the track only once there is a goal', () => {
    render(<MileagePlanner />)
    expect(document.querySelector('.trackcard .the-line')).toBeNull()
    expect(screen.getByRole('figure')).toBeTruthy()
    type('Monday', '6')
    expect(document.querySelector('.trackcard').textContent).toContain('Mon6')
    type('Goal mileage', '35')
    expect(document.querySelector('.trackcard .the-line')).toBeTruthy()
    expect(document.querySelector('.trackcard').textContent).toContain('5 a day makes 35')
    expect(document.querySelector('figcaption').textContent).toContain('The black line is 5 miles, the daily average that makes 35.')
  })
})
