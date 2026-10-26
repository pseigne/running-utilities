import { useState } from 'react'
import { BigNumber } from '../../kit/BigNumber'
import { Button } from '../../kit/Button'
import { Card } from '../../kit/Card'
import { HeroCard } from '../../kit/HeroCard'
import { NumberField } from '../../kit/NumberField'
import { TrackCard } from '../../kit/TrackCard'
import { DAYS, EMPTY_WEEK, formatMiles, spread, summarize } from './model'
import { WeekChart } from './WeekChart'
import './mileage.css'

const MILES_HINT = 'Enter a number of miles.'

// The original planner's layout, top to bottom: the title, the week as a chart, a field for each day
// with the goal and the button under them, and what's left.
export default function MileagePlanner() {
  const [goal, setGoal] = useState('')
  const [days, setDays] = useState(EMPTY_WEEK)
  // Days filled by spreading, shown quieter until someone types over them.
  const [spreadDays, setSpreadDays] = useState(() => new Set())
  const [said, setSaid] = useState('')
  const week = summarize(goal, days)

  const setDay = (index, text) => {
    setDays(old => old.with(index, text))
    setSpreadDays(old => {
      if (!old.has(index)) return old
      const next = new Set(old)
      next.delete(index)
      return next
    })
  }
  const spreadRest = () => {
    const result = spread(goal, days)
    if (!result) return
    setDays(result.days)
    setSpreadDays(old => new Set([...old, ...result.spread]))
    setSaid(`Spread ${miles(week.remaining)} over ${count(result.spread.length, 'day')}.`)
  }

  return (
    <div className="mileage">
      <h1 className="tool-title">Weekly Mileage Planner</h1>

      <TrackCard caption={caption(week)} className="week">
        <WeekChart week={week} spreadDays={spreadDays} />
      </TrackCard>

      <Card className="inputs">
        <div className="days">
          {DAYS.map((day, index) => (
            <NumberField
              key={day.key}
              label={day.name}
              value={days[index]}
              onChange={text => setDay(index, text)}
              invalid={week.days[index].invalid}
              hint={week.days[index].invalid ? MILES_HINT : undefined}
              className={spreadDays.has(index) ? 'day spread' : 'day'}
            />
          ))}
        </div>
        <NumberField
          label="Goal mileage"
          value={goal}
          onChange={setGoal}
          unit="mi"
          placeholder="0"
          invalid={week.goalInvalid}
          hint={week.goalInvalid ? 'Enter the goal as a number of miles.' : undefined}
          className="goal"
        />
        <Button className="spread-btn" onClick={spreadRest} disabled={week.state !== 'open'}>
          Distribute remaining mileage
        </Button>
        {week.state !== 'open' && <p className="note">{whyNoSpread(week)}</p>}
        <p className="vh" role="status">{said}</p>
      </Card>

      <HeroCard className="remaining" level={2} title="Remaining mileage" number={<Answer week={week} />} />
    </div>
  )
}

// The one number: what's left, what's over, or, with no goal, what's planned.
function Answer({ week }) {
  if (week.state === 'no-goal') return <BigNumber value={formatMiles(week.planned)} unit="mi planned" />
  if (week.state === 'over') return <BigNumber value={formatMiles(-week.remaining)} unit="mi over" />
  return <BigNumber value={formatMiles(week.remaining)} unit="mi to go" />
}

// Why the button can't spread anything right now.
function whyNoSpread(week) {
  if (week.state === 'no-goal') return 'Set a goal to spread what’s left over the open days.'
  if (week.state === 'full') return 'Every day has miles. Clear one to spread onto it.'
  if (week.state === 'met') return 'The week is on target.'
  return 'The week is already over the goal.'
}

function caption(week) {
  const bars = 'Each bar is a day’s miles: filled for runs you entered, outlined for miles spread over open days.'
  if (week.goal === null) return `${bars} Set a goal to draw the line.`
  return `${bars} The black line is ${formatMiles(week.average)} miles, the daily average that makes ${formatMiles(week.goal)}.`
}

function miles(amount) {
  return `${formatMiles(amount)} ${amount === 1 ? 'mile' : 'miles'}`
}

function count(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}
