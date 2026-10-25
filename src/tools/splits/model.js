// The track split calculator's arithmetic, apart from the page. Inputs stay as typed strings.

export const MILE = 1609.344

export const DISTANCES = [
  { value: '800', label: '800 m', meters: 800 },
  { value: '1500', label: '1500 m', meters: 1500 },
  { value: 'mile', label: 'Mile', meters: MILE, name: 'mile' },
  { value: '3000', label: '3000 m', meters: 3000 },
  { value: '5000', label: '5000 m', meters: 5000 },
  { value: '10000', label: '10,000 m', meters: 10000 },
  { value: 'other', label: 'Other' },
]

export const TRACKS = [
  { value: '200', label: '200 m', meters: 200 },
  { value: '400', label: '400 m', meters: 400 },
  { value: 'other', label: 'Other' },
]

// More rows than this is a typo (a 10,000 on a 1 m track), not a race.
export const MAX_LAPS = 200

// A typed number: null when empty, NaN when it isn't a number of the right kind, otherwise the number.
export function readNumber(text, { whole = false } = {}) {
  const trimmed = String(text ?? '').trim()
  if (trimmed === '') return null
  const pattern = whole ? /^\d+$/ : /^\d*\.?\d+$|^\d+\.$/
  return pattern.test(trimmed) ? Number(trimmed) : NaN
}

// The goal time from its three fields. Minutes or seconds of 60 and more still count, and roll over
// into the time (75 minutes is 1:15:00); `rolled` says so, so the page can show the time it read.
export function readTime({ hours, minutes, seconds }) {
  const h = readNumber(hours, { whole: true })
  const m = readNumber(minutes, { whole: true })
  const s = readNumber(seconds)
  const invalid = { hours: Number.isNaN(h), minutes: Number.isNaN(m), seconds: Number.isNaN(s) }
  if (invalid.hours || invalid.minutes || invalid.seconds) return { seconds: null, invalid, rolled: false }
  const total = (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0)
  return {
    seconds: total > 0 ? total : null,
    invalid,
    rolled: total > 0 && ((m ?? 0) >= 60 || (s ?? 0) >= 60),
  }
}

// A distance or track length from its pills and its "Other" field: metres, or null with the reason.
export function readChoice(list, value, custom) {
  const choice = list.find(item => item.value === value)
  if (!choice) return { meters: null, reason: 'none' }
  if (choice.value !== 'other') return { meters: choice.meters, reason: null }
  const meters = readNumber(custom)
  if (meters === null) return { meters: null, reason: 'empty' }
  if (Number.isNaN(meters) || meters <= 0) return { meters: null, reason: 'invalid' }
  return { meters, reason: null }
}

// Where the laps fall. A race that isn't a whole number of laps starts part of the way round, so its
// first stretch is short: 300 m for a 1500 on a 400, 9.34 m for a mile.
export function lapPlan(distance, lap) {
  const left = distance % lap
  const start = left > 0.1 && lap - left > 0.1 ? left : 0
  const laps = Math.round((distance - start) / lap)
  if (laps + (start ? 1 : 0) > MAX_LAPS) return null
  const plan = []
  let at = 0
  if (start) {
    at = start
    plan.push({ key: 'start', label: 'Start', meters: start, at })
  }
  for (let n = 1; n <= laps; n += 1) {
    at = n === laps ? distance : at + lap
    plan.push({ key: n, label: String(n), meters: lap, at })
  }
  return plan
}

// Even pace from the gun: each stretch's split and the clock as it ends, and the pace in the units
// runners talk in. Null when the race would have more than MAX_LAPS rows.
export function splits(seconds, distance, lap) {
  const plan = lapPlan(distance, lap)
  if (!plan) return null
  const perMeter = seconds / distance
  return {
    rows: plan.map(step => ({ ...step, split: step.meters * perMeter, total: step.at * perMeter })),
    pace: { perLap: lap * perMeter, per400: 400 * perMeter, perKm: 1000 * perMeter, perMile: MILE * perMeter },
    start: plan[0].key === 'start' ? plan[0].meters : 0,
  }
}

// The clock: m:ss.ss, or h:mm:ss.ss from an hour. Hundredths are rounded first, so 59.999 is 1:00.00.
export function formatClock(seconds) {
  const hundredths = Math.round(seconds * 100)
  const h = Math.floor(hundredths / 360000)
  const m = Math.floor((hundredths % 360000) / 6000)
  const s = (hundredths % 6000) / 100
  const ss = s.toFixed(2).padStart(5, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

// A split in seconds the way runners say laps ("60.00", "72.00"), and on the clock from 100 seconds.
export function formatSplit(seconds) {
  const hundredths = Math.round(seconds * 100)
  return hundredths < 10000 ? (hundredths / 100).toFixed(2) : formatClock(seconds)
}

// Metres to show: whole metres, with a thousands comma like the race names.
export function formatMeters(meters) {
  return `${Math.round(meters).toLocaleString('en-US')} m`
}

// The race in words: "mile", or its metres.
export function raceName(distanceValue, meters) {
  const preset = DISTANCES.find(item => item.value === distanceValue)
  return preset?.name || formatMeters(meters)
}
