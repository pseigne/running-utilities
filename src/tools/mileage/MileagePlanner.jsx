import { useId, useState } from 'react'
import { BigNumber } from '../../kit/BigNumber'
import { Button } from '../../kit/Button'
import { Card } from '../../kit/Card'
import { HeroCard } from '../../kit/HeroCard'
import { NumberField } from '../../kit/NumberField'
import { DAYS, EMPTY_WEEK, formatMiles, spread, summarize } from './model'
import './mileage.css'

// The original planner's layout, top to bottom: the title, the week as track lanes, a field for each
// day with the goal and the button under them, and what's left.
export default function MileagePlanner() {
  const [goal, setGoal] = useState('')
  const [days, setDays] = useState(EMPTY_WEEK)
  // Days filled by spreading, shown quieter until someone types over them.
  const [spreadDays, setSpreadDays] = useState(() => new Set())
  const [said, setSaid] = useState('')
  const week = summarize(goal, days)
  const captionId = useId()

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

      <figure className="week" aria-labelledby={captionId}>
        <Lanes week={week} spreadDays={spreadDays} />
        <figcaption className="vh" id={captionId}>{caption(week)}</figcaption>
      </figure>

      <Card className="inputs">
        <div className="days">
          {DAYS.map((day, index) => (
            <NumberField
              key={day.key}
              label={day.name}
              value={days[index]}
              onChange={text => setDay(index, text)}
              invalid={week.days[index].invalid}
              className={`day ${spreadDays.has(index) ? 'spread' : week.days[index].open ? 'open' : 'run'}`}
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
          className="goal"
        />
        <Button className="spread-btn" onClick={spreadRest} disabled={week.state !== 'open'}>
          Distribute remaining mileage
        </Button>
        <p className="vh" role="status">{said}</p>
      </Card>

      <HeroCard className="remaining" level={2} title="Remaining mileage" number={<Answer week={week} />} />
    </div>
  )
}

// The week on the track: a lane for each day, run from the start line up, filled for runs and outlined
// for miles spread over open days, with the finish line at the daily average that makes the goal. Each
// lane's day and miles sit under the start line. The day fields carry the same numbers for screen readers.
function Lanes({ week, spreadDays }) {
  const values = week.days.map(day => (day.open || day.invalid ? 0 : day.miles))
  const top = Math.max(...values, week.average ?? 0) * 1.15
  const share = miles => (top > 0 ? `${(miles / top) * 100}%` : '0%')
  return (
    <div className="lanes-wrap" aria-hidden="true">
      <div className="lanes">
        {DAYS.map((day, index) => (
          <div className="lane" key={day.key}>
            {values[index] > 0 && <div className={`lane-run${spreadDays.has(index) ? ' spread' : ''}`} style={{ height: share(values[index]) }} />}
          </div>
        ))}
        {week.average > 0 && (
          <div className="lane-finish" style={{ bottom: share(week.average) }} />
        )}
      </div>
      <div className="lane-days">
        {DAYS.map((day, index) => (
          <p key={day.key}>{day.short}<b>{values[index] > 0 ? formatMiles(values[index]) : '–'}</b></p>
        ))}
      </div>
    </div>
  )
}

// The one number, as the original had it: the goal less what's planned, under nothing once it's over.
function Answer({ week }) {
  const left = (week.goal ?? 0) - week.planned
  return <BigNumber value={left < 0 ? `−${formatMiles(-left)}` : formatMiles(left)} unit="mi" />
}

// For screen readers only: what the lanes show.
function caption(week) {
  const bars = 'Each lane is a day’s miles: filled for runs you entered, outlined for miles spread over open days.'
  if (week.goal === null) return `${bars} Set a goal to draw the finish line.`
  return `${bars} The finish line is ${formatMiles(week.average)} miles, the daily average that makes ${formatMiles(week.goal)}.`
}

function miles(amount) {
  return `${formatMiles(amount)} ${amount === 1 ? 'mile' : 'miles'}`
}

function count(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}
