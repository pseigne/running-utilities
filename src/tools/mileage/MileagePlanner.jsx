import { useState } from 'react'
import { BigNumber } from '../../kit/BigNumber'
import { Button } from '../../kit/Button'
import { Card } from '../../kit/Card'
import { DataTable } from '../../kit/DataTable'
import { HeroCard } from '../../kit/HeroCard'
import { NumberField } from '../../kit/NumberField'
import { TrackCard } from '../../kit/TrackCard'
import { DAYS, EMPTY_WEEK, formatMiles, spread, summarize } from './model'
import { WeekChart } from './WeekChart'
import './mileage.css'

const MILES_HINT = 'Enter miles as a number, like 6 or 6.5.'

// How many miles are left this week, and where they go.
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
  const clear = () => {
    setDays(EMPTY_WEEK)
    setSpreadDays(new Set())
    setSaid('Cleared the week.')
  }

  const columns = [
    {
      key: 'day', label: 'Day', kind: 'em', phone: 'main',
      render: row => <>{row.day.name}{spreadDays.has(row.index) && <span className="tag">spread</span>}</>,
    },
    {
      key: 'miles', label: 'Miles', align: 'r', phone: 'end',
      render: row => (
        <NumberField
          label={row.day.name}
          hideLabel
          value={days[row.index]}
          onChange={text => setDay(row.index, text)}
          invalid={week.days[row.index].invalid}
          hint={week.days[row.index].invalid ? MILES_HINT : undefined}
          className={spreadDays.has(row.index) ? 'spread' : ''}
        />
      ),
    },
    { key: 'total', label: 'Week so far', align: 'r', kind: 'q', phone: 'endsub', render: row => formatMiles(week.totals[row.index]) },
  ]
  const rows = [
    ...DAYS.map((day, index) => ({ key: day.key, day, index })),
    { key: 'goal', line: goalLine(week) },
  ]

  return (
    <>
      <HeroCard title="Weekly mileage" number={<Answer week={week} />} lead={<Lead week={week} />}>
        <div className="controls">
          <NumberField
            label="Weekly goal"
            value={goal}
            onChange={setGoal}
            unit="mi"
            invalid={week.goalInvalid}
            hint={week.goalInvalid ? 'Enter the goal as a number of miles.' : undefined}
          />
          <Button onClick={spreadRest} disabled={week.state !== 'open'}>Spread the rest over open days</Button>
          <Button quiet onClick={clear} disabled={days.every(text => text === '')}>Clear the week</Button>
          {week.state !== 'open' && <p className="note">{whyNoSpread(week)}</p>}
        </div>
        <p className="vh" role="status">{said}</p>
      </HeroCard>
      <div className="mileage-grid">
        <TrackCard title="The week" caption={caption(week)}>
          <WeekChart week={week} spreadDays={spreadDays} />
        </TrackCard>
        <Card title="The days" className="days">
          <DataTable caption="Miles for each day of the week" columns={columns} rows={rows} />
        </Card>
      </div>
    </>
  )
}

// The one number: what's left, what's over, or, with no goal, what's planned.
function Answer({ week }) {
  if (week.state === 'no-goal') return <BigNumber value={formatMiles(week.planned)} unit="mi planned" />
  if (week.state === 'over') return <BigNumber value={formatMiles(-week.remaining)} unit="mi over" />
  return <BigNumber value={formatMiles(week.remaining)} unit="mi to go" />
}

function Lead({ week }) {
  const planned = formatMiles(week.planned)
  const goal = week.goal === null ? null : formatMiles(week.goal)
  switch (week.state) {
    case 'no-goal':
      if (week.goalInvalid) return 'Enter the goal as a number of miles to see what’s left.'
      return week.planned > 0 ? `${miles(week.planned)} planned so far. Set a weekly goal to see what’s left.` : 'Set a weekly goal to see what’s left.'
    case 'open':
      return <>{planned} of {goal} miles planned. <b>{formatMiles(week.remaining)} to go</b> across {count(week.openDays, 'open day')}, about {formatMiles(week.perOpenDay)} a day.</>
    case 'full':
      return <>{planned} of {goal} miles planned, with every day filled. Add <b>{formatMiles(week.remaining)}</b> to a day to reach the goal.</>
    case 'met':
      return <>{goal} of {goal} miles planned. <b>The week is on target.</b></>
    default:
      return <>{miles(week.planned)} planned, <b>{formatMiles(-week.remaining)} over</b> your {goal}-mile goal.</>
  }
}

function whyNoSpread(week) {
  if (week.state === 'no-goal') return 'Set a goal to spread what’s left over the open days.'
  if (week.state === 'full') return 'Every day has miles. Clear one to spread onto it.'
  return 'Nothing left to spread.'
}

function goalLine(week) {
  const goal = week.goal === null ? null : `${formatMiles(week.goal)} mi`
  if (week.state === 'no-goal') return { label: 'No goal yet', off: true }
  if (week.state === 'met') return { label: 'Goal reached', value: goal }
  if (week.state === 'over') return { label: `Goal · ${formatMiles(-week.remaining)} mi over`, value: goal }
  return { label: `Goal · ${formatMiles(week.remaining)} mi to go`, value: goal, off: true }
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
