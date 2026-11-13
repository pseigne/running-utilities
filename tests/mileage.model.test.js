import { describe, expect, it } from 'vitest'
import { DAYS, EMPTY_WEEK, formatMiles, readMiles, spread, summarize } from '../src/tools/mileage/model'

const week = (...miles) => DAYS.map((_, index) => miles[index] ?? '')
const sum = texts => Math.round(texts.reduce((total, text) => total + (Number(text) || 0), 0) * 100) / 100

describe('readMiles', () => {
  it('reads numbers, empty, and nonsense', () => {
    expect(readMiles('6')).toBe(6)
    expect(readMiles(' 6.5 ')).toBe(6.5)
    expect(readMiles('.5')).toBe(0.5)
    expect(readMiles('5.')).toBe(5)
    expect(readMiles('0')).toBe(0)
    expect(readMiles('')).toBeNull()
    expect(readMiles('   ')).toBeNull()
    expect(readMiles('x')).toBeNaN()
    expect(readMiles('-3')).toBeNaN()
    expect(readMiles('1e3')).toBeNaN()
    expect(readMiles('3..2')).toBeNaN()
  })
})

describe('formatMiles', () => {
  it('drops trailing zeros and keeps two decimals at most', () => {
    expect(formatMiles(5)).toBe('5')
    expect(formatMiles(8.7)).toBe('8.7')
    expect(formatMiles(8.666)).toBe('8.67')
    expect(formatMiles(0.1 + 0.2)).toBe('0.3')
  })
})

describe('summarize', () => {
  it('works out what is left for the open days', () => {
    const result = summarize('50', week('6', '8', '', '10', '', '', ''))
    expect(result.planned).toBe(24)
    expect(result.remaining).toBe(26)
    expect(result.openDays).toBe(4)
    expect(result.perOpenDay).toBe(6.5)
    expect(result.average).toBe(7.14)
    expect(result.state).toBe('open')
    expect(result.totals).toEqual([6, 14, 14, 24, 24, 24, 24])
  })

  it('reports the old example: 50 with 20 on Monday leaves 30', () => {
    const result = summarize('50', week('20'))
    expect(result.remaining).toBe(30)
    expect(result.perOpenDay).toBe(5)
  })

  it('has no goal, and no NaN, while the goal is empty or not a number', () => {
    for (const goal of ['', 'abc', '0']) {
      const result = summarize(goal, week('5'))
      expect(result.state).toBe('no-goal')
      expect(result.remaining).toBeNull()
      expect(result.perOpenDay).toBeNull()
      expect(result.planned).toBe(5)
    }
    expect(summarize('abc', EMPTY_WEEK).goalInvalid).toBe(true)
    expect(summarize('', EMPTY_WEEK).goalInvalid).toBe(false)
  })

  it('knows a met goal, an over goal, and a full week short of the goal', () => {
    expect(summarize('14', week('7', '7')).state).toBe('met')
    const over = summarize('10', week('6', '6.5'))
    expect(over.state).toBe('over')
    expect(over.remaining).toBe(-2.5)
    const full = summarize('50', week('7', '7', '7', '7', '7', '7', '6'))
    expect(full.state).toBe('full')
    expect(full.remaining).toBe(2)
    expect(full.perOpenDay).toBeNull()
  })

  it('counts a mistyped day as neither run nor open', () => {
    const result = summarize('30', week('10', 'x'))
    expect(result.days[1]).toEqual({ miles: NaN, invalid: true, open: false })
    expect(result.planned).toBe(10)
    expect(result.openDays).toBe(5)
  })

  it('treats 0 as a rest day that was entered, not an open one', () => {
    const result = summarize('30', week('0', '10'))
    expect(result.openDays).toBe(5)
    expect(result.days[0].open).toBe(false)
  })

  it('adds decimals without floating-point dust', () => {
    expect(summarize('1', week('0.1', '0.2')).planned).toBe(0.3)
    expect(summarize('1', week('0.1', '0.2')).remaining).toBe(0.7)
  })
})

describe('spread', () => {
  it('fills the open days evenly', () => {
    const result = spread('50', week('20'))
    expect(result.days).toEqual(['20', '5', '5', '5', '5', '5', '5'])
    expect(result.spread).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('rounds to tenths and puts the leftover on the last open day, so the week adds up exactly', () => {
    const result = spread('50', week('6', '8', '', '10'))
    expect(result.days).toEqual(['6', '8', '6.5', '10', '6.5', '6.5', '6.5'])
    expect(spread('26', week('', '', '', '0', '0', '0', '0')).days.slice(0, 3)).toEqual(['8.7', '8.7', '8.6'])
    expect(spread('10', week('', '', '', '0', '0', '0', '0')).days.slice(0, 3)).toEqual(['3.3', '3.3', '3.4'])
    for (const goal of ['50', '33.33', '41.7', '3.3', '100']) {
      const result = spread(goal, week('3.25'))
      expect(sum(result.days)).toBe(Number(goal))
      expect(result.days.every(text => Number(text) >= 0)).toBe(true)
    }
  })

  it('never makes a day negative when the rounding goes up', () => {
    const result = spread('0.35', EMPTY_WEEK)
    expect(sum(result.days)).toBe(0.35)
    expect(result.days.every(text => Number(text) >= 0)).toBe(true)
  })

  it('leaves mistyped days alone', () => {
    const result = spread('30', week('10', 'x'))
    expect(result.days[1]).toBe('x')
    expect(result.spread).toEqual([2, 3, 4, 5, 6])
    expect(sum(result.days.filter(text => text !== 'x'))).toBe(30)
  })

  it('refuses with no goal, nothing left, too much already, or no open days', () => {
    expect(spread('', week('5'))).toBeNull()
    expect(spread('14', week('7', '7'))).toBeNull()
    expect(spread('10', week('12'))).toBeNull()
    expect(spread('50', week('7', '7', '7', '7', '7', '7', '6'))).toBeNull()
  })
})
