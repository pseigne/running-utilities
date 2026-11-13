import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import MileagePlanner from '../src/tools/mileage/MileagePlanner'

afterEach(cleanup)

const type = (name, value) => fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } })
const number = () => document.querySelector('.num').textContent
const spreadButton = () => screen.getByRole('button', { name: 'Distribute remaining mileage' })
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

  it('starts with nothing left and the button off', () => {
    render(<MileagePlanner />)
    expect(number()).toBe('0mi')
    expect(spreadButton().disabled).toBe(true)
  })

  it('keeps the old example: a 50 goal and 20 on Monday leave 30, 5 a day', () => {
    render(<MileagePlanner />)
    type('Goal mileage', '50')
    type('Monday', '20')
    expect(number()).toBe('30mi')
    fireEvent.click(spreadButton())
    expect(screen.getByRole('textbox', { name: 'Tuesday' }).value).toBe('5')
    expect(screen.getByRole('textbox', { name: 'Sunday' }).value).toBe('5')
    expect(spreadDays()).toEqual(['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    expect(screen.getByRole('status').textContent).toBe('Spread 30 miles over 6 days.')
    expect(number()).toBe('0mi')
    expect(spreadButton().disabled).toBe(true)
  })

  it('counts what’s planned against no goal, as the original did', () => {
    render(<MileagePlanner />)
    type('Monday', '6')
    type('Wednesday', '4.5')
    expect(number()).toBe('−10.5mi')
  })

  it('stops calling a day spread once it is typed over', () => {
    render(<MileagePlanner />)
    type('Goal mileage', '14')
    fireEvent.click(spreadButton())
    expect(screen.getByRole('textbox', { name: 'Monday' }).value).toBe('2')
    type('Monday', '4')
    expect(spreadDays()).not.toContain('Monday')
    expect(spreadDays()).toHaveLength(6)
    expect(number()).toBe('−2mi')
  })

  it('keeps the button off once every day is filled', () => {
    render(<MileagePlanner />)
    type('Goal mileage', '50')
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) type(day, '7')
    expect(number()).toBe('1mi')
    expect(spreadButton().disabled).toBe(true)
  })

  it('marks a goal or a day that isn’t a number, with no words added, and never shows NaN', () => {
    render(<MileagePlanner />)
    type('Goal mileage', 'fifty')
    expect(screen.getByRole('textbox', { name: 'Goal mileage' }).getAttribute('aria-invalid')).toBe('true')
    type('Tuesday', 'x')
    expect(screen.getByRole('textbox', { name: 'Tuesday' }).getAttribute('aria-invalid')).toBe('true')
    expect(document.querySelector('.field-hint')).toBeNull()
    expect(document.body.textContent).not.toContain('NaN')
  })

  it('labels each lane and draws the finish line only once there is a goal', () => {
    render(<MileagePlanner />)
    expect(document.querySelector('.lane-finish')).toBeNull()
    expect(screen.getByRole('figure')).toBeTruthy()
    type('Monday', '6')
    expect(document.querySelector('.lane-days').textContent).toContain('Mon6')
    expect(document.querySelectorAll('.lane-run')).toHaveLength(1)
    type('Goal mileage', '35')
    expect(document.querySelector('.lane-finish').style.bottom).toBe(`${(5 / (6 * 1.15)) * 100}%`)
    // the caption is for screen readers only
    expect(document.querySelector('figcaption').className).toBe('vh')
    expect(document.querySelector('figcaption').textContent).toContain('The finish line is 5 miles, the daily average that makes 35.')
    fireEvent.click(screen.getByRole('button', { name: 'Distribute remaining mileage' }))
    expect(document.querySelectorAll('.lane-run.spread')).toHaveLength(6)
  })
})
