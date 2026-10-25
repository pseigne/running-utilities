// The weekly mileage planner's arithmetic, apart from the page. Inputs stay as the strings that were
// typed; everything here decides what they mean.

export const DAYS = [
  { key: 'mon', name: 'Monday', short: 'Mon' },
  { key: 'tue', name: 'Tuesday', short: 'Tue' },
  { key: 'wed', name: 'Wednesday', short: 'Wed' },
  { key: 'thu', name: 'Thursday', short: 'Thu' },
  { key: 'fri', name: 'Friday', short: 'Fri' },
  { key: 'sat', name: 'Saturday', short: 'Sat' },
  { key: 'sun', name: 'Sunday', short: 'Sun' },
]

export const EMPTY_WEEK = DAYS.map(() => '')

// A typed amount of miles: null when empty, NaN when it isn't a number of miles (negative, or not a
// number at all), otherwise the number.
export function readMiles(text) {
  const trimmed = String(text ?? '').trim()
  if (trimmed === '') return null
  if (!/^\d*\.?\d+$|^\d+\.$/.test(trimmed)) return NaN
  return Number(trimmed)
}

// Miles to show: at most two decimals, and no trailing zeros.
export function formatMiles(miles) {
  return String(Math.round(miles * 100) / 100)
}

// Everything the page says about the week. A day that isn't a number counts as neither run nor open,
// so a typo never spreads miles over it or adds to the total.
export function summarize(goalText, dayTexts) {
  const goal = readMiles(goalText)
  const days = dayTexts.map(text => {
    const miles = readMiles(text)
    return { miles, invalid: Number.isNaN(miles), open: miles === null }
  })
  const planned = hundredths(days.reduce((sum, day) => sum + (day.invalid || day.open ? 0 : day.miles), 0))
  const openDays = days.filter(day => day.open).length
  const goalInvalid = Number.isNaN(goal)
  const hasGoal = goal !== null && !goalInvalid && goal > 0
  const remaining = hasGoal ? hundredths(goal - planned) : null
  const totals = []
  days.reduce((sum, day) => {
    const next = sum + (day.invalid || day.open ? 0 : day.miles)
    totals.push(hundredths(next))
    return next
  }, 0)
  let state
  if (!hasGoal) state = 'no-goal'
  else if (remaining < 0) state = 'over'
  else if (remaining === 0) state = 'met'
  else if (openDays === 0) state = 'full'
  else state = 'open'
  return {
    goal: hasGoal ? goal : null,
    goalInvalid,
    days,
    totals,
    planned,
    openDays,
    remaining,
    perOpenDay: state === 'open' ? hundredths(remaining / openDays) : null,
    average: hasGoal ? hundredths(goal / DAYS.length) : null,
    state,
  }
}

// Fills the open days with what's left of the goal: tenths of a mile, as even as they can be, with the
// rounding left over on the last open day so the week adds up to the goal exactly. Null when there is
// nothing to spread or nowhere to put it.
export function spread(goalText, dayTexts) {
  const week = summarize(goalText, dayTexts)
  if (week.state !== 'open') return null
  const open = week.days.map((day, index) => (day.open ? index : -1)).filter(index => index >= 0)
  // in hundredths of a mile, so the sums are exact
  const left = Math.round(week.remaining * 100)
  let each = Math.round(left / open.length / 10) * 10
  if (each * (open.length - 1) > left) each = Math.floor(left / open.length / 10) * 10
  const last = left - each * (open.length - 1)
  const next = [...dayTexts]
  open.forEach((index, n) => {
    next[index] = formatMiles((n === open.length - 1 ? last : each) / 100)
  })
  return { days: next, spread: open }
}

function hundredths(miles) {
  return Math.round(miles * 100) / 100
}
