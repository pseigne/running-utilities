import { describe, expect, it } from 'vitest'
import {
  DISTANCES, MAX_LAPS, MILE, TRACKS, formatClock, formatMeters, formatSplit, lapPlan, raceName, readChoice, readNumber, readTime, splits,
} from '../src/tools/splits/model'

const time = (hours, minutes, seconds) => readTime({ hours, minutes, seconds })

describe('reading the fields', () => {
  it('reads whole and decimal numbers', () => {
    expect(readNumber('4')).toBe(4)
    expect(readNumber('59.5')).toBe(59.5)
    expect(readNumber('')).toBeNull()
    expect(readNumber('1.5', { whole: true })).toBeNaN()
    expect(readNumber('-2')).toBeNaN()
    expect(readNumber('abc')).toBeNaN()
  })

  it('adds up the goal time, and has none at zero', () => {
    expect(time('', '4', '').seconds).toBe(240)
    expect(time('1', '2', '3.5').seconds).toBe(3723.5)
    expect(time('', '', '').seconds).toBeNull()
    expect(time('0', '0', '0').seconds).toBeNull()
  })

  it('rolls 60 and more into the time and says it did', () => {
    expect(time('', '75', '')).toMatchObject({ seconds: 4500, rolled: true })
    expect(time('', '1', '90')).toMatchObject({ seconds: 150, rolled: true })
    expect(time('', '59', '59.99').rolled).toBe(false)
  })

  it('names the field that isn’t a number', () => {
    const result = time('1.5', '4', 'x')
    expect(result.seconds).toBeNull()
    expect(result.invalid).toEqual({ hours: true, minutes: false, seconds: true })
  })

  it('reads a preset or an Other value, with the reason when there isn’t one', () => {
    expect(readChoice(DISTANCES, 'mile', '')).toEqual({ meters: MILE, reason: null })
    expect(readChoice(DISTANCES, 'other', '1200')).toEqual({ meters: 1200, reason: null })
    expect(readChoice(DISTANCES, 'other', '')).toEqual({ meters: null, reason: 'empty' })
    expect(readChoice(TRACKS, 'other', '0')).toEqual({ meters: null, reason: 'invalid' })
    expect(readChoice(TRACKS, 'other', 'far')).toEqual({ meters: null, reason: 'invalid' })
    expect(readChoice(TRACKS, 'nope', '')).toEqual({ meters: null, reason: 'none' })
  })

  it('ignores the Other field once a preset is chosen', () => {
    expect(readChoice(DISTANCES, '800', '1200').meters).toBe(800)
  })
})

describe('lapPlan', () => {
  it('splits an 800 on a 400 into two laps', () => {
    expect(lapPlan(800, 400).map(step => [step.label, step.meters, step.at])).toEqual([['1', 400, 400], ['2', 400, 800]])
  })

  it('starts a 1500 300 m round a 400 and 100 m round a 200', () => {
    expect(lapPlan(1500, 400).map(step => [step.label, step.at])).toEqual([['Start', 300], ['1', 700], ['2', 1100], ['3', 1500]])
    const on200 = lapPlan(1500, 200)
    expect(on200[0]).toMatchObject({ label: 'Start', meters: 100 })
    expect(on200).toHaveLength(8)
  })

  it('starts the mile 9.34 m before a 400 m lap', () => {
    const plan = lapPlan(MILE, 400)
    expect(plan[0].label).toBe('Start')
    expect(plan[0].meters).toBeCloseTo(9.344, 3)
    expect(plan.at(-1).at).toBe(MILE)
    expect(plan).toHaveLength(5)
  })

  it('takes custom lengths, and refuses a race of more than MAX_LAPS rows', () => {
    expect(lapPlan(1200, 300).map(step => step.at)).toEqual([300, 600, 900, 1200])
    expect(lapPlan(10000, 1)).toBeNull()
    expect(lapPlan(MAX_LAPS * 400, 400)).toHaveLength(MAX_LAPS)
  })
})

describe('splits', () => {
  it('runs an 800 in 2:00 as two 60s laps', () => {
    const result = splits(120, 800, 400)
    expect(result.rows.map(row => [formatSplit(row.split), formatClock(row.total)])).toEqual([['60.00', '1:00.00'], ['60.00', '2:00.00']])
    expect(result.start).toBe(0)
  })

  it('gives a 4:00 mile its start, laps, and paces', () => {
    const result = splits(240, MILE, 400)
    expect(formatSplit(result.rows[0].split)).toBe('1.39')
    expect(formatSplit(result.rows[1].split)).toBe('59.65')
    expect(formatClock(result.rows.at(-1).total)).toBe('4:00.00')
    expect(formatSplit(result.pace.per400)).toBe('59.65')
    expect(formatClock(result.pace.perKm)).toBe('2:29.13')
    expect(formatClock(result.pace.perMile)).toBe('4:00.00')
    expect(result.start).toBeCloseTo(9.344, 3)
  })

  it('handles hours: a 10,000 in an hour on a 200', () => {
    const result = splits(3600, 10000, 200)
    expect(result.rows).toHaveLength(50)
    expect(formatSplit(result.rows[0].split)).toBe('72.00')
    expect(formatClock(result.rows.at(-1).total)).toBe('1:00:00.00')
    expect(formatSplit(result.pace.perLap)).toBe('72.00')
  })

  it('keeps the 1500 on a 400 even: 300 m in 3/15 of the time', () => {
    const result = splits(225, 1500, 400)
    expect(formatSplit(result.rows[0].split)).toBe('45.00')
    expect(formatSplit(result.rows[1].split)).toBe('60.00')
  })

  it('is null for a race with too many laps', () => {
    expect(splits(100, 10000, 1)).toBeNull()
  })
})

describe('formatting', () => {
  it('writes clocks, and splits in seconds below 100, with hundredths rounded first', () => {
    expect(formatClock(59.999)).toBe('1:00.00')
    expect(formatClock(5.5)).toBe('0:05.50')
    expect(formatClock(3723.456)).toBe('1:02:03.46')
    expect(formatSplit(59.994)).toBe('59.99')
    expect(formatSplit(59.996)).toBe('60.00')
    expect(formatSplit(75)).toBe('75.00')
    expect(formatSplit(99.996)).toBe('1:40.00')
    expect(formatSplit(150)).toBe('2:30.00')
  })

  it('writes metres and race names', () => {
    expect(formatMeters(10000)).toBe('10,000 m')
    expect(formatMeters(9.344)).toBe('9 m')
    expect(raceName('mile', MILE)).toBe('mile')
    expect(raceName('1500', 1500)).toBe('1,500 m')
    expect(raceName('other', 1200)).toBe('1,200 m')
  })
})
