import { useState } from 'react'
import { BigNumber } from './BigNumber'
import { Card } from './Card'
import { DataTable } from './DataTable'
import { DetailCard } from './DetailCard'
import { FinishLine } from './FinishLine'
import { Details, HeroCard } from './HeroCard'
import { NumberField } from './NumberField'
import { PillChoice } from './Pills'
import { TrackCard } from './TrackCard'

// Every kit component on one page, for development only (open #kit on the dev server). The browser
// tests check it for layout and accessibility at each width and in both themes.
export default function Gallery() {
  const [goal, setGoal] = useState('50')
  const [miles, setMiles] = useState({ Mon: '6', Tue: '', Wed: 'x' })
  const [track, setTrack] = useState('400')
  const rows = [
    { key: 1, lap: 1, at: '400 m', split: '59.65', total: '0:59.65' },
    { key: 2, lap: 2, at: '800 m', split: '59.65', total: '1:59.30' },
    { key: 3, lap: 3, at: '1200 m', split: '59.65', total: '2:58.95' },
    { key: 'line', line: { label: 'Goal · 1 mile', value: '4:00.00' } },
  ]
  return (
    <>
      <HeroCard
        title="Kit"
        number={<BigNumber value="26" unit="mi" />}
        lead={<>24 of 50 miles planned. <b>26 to go</b> across 3 open days, about 8.7 a day.</>}
      >
        <Details>
          <DetailCard title="Per 400 m" spark={<Spark />}>A 4:00 mile is <b>59.65</b> a lap.</DetailCard>
          <DetailCard title="Linked card" action="Open it" href="#kit">Detail cards can <b>link</b> somewhere.</DetailCard>
        </Details>
      </HeroCard>

      <HeroCard title="Big field" number={<NumberField label="Weekly goal" value={goal} onChange={setGoal} unit="mi" big />} lead="A big field reads as the hero’s number." />

      <TrackCard title="Track card" caption="White lanes, white dots, and one black stroke: the line.">
        <svg viewBox="0 0 600 120" role="img" aria-label="Three runners on three lanes, the line at 400 metres">
          {[30, 60, 90].map(y => <line key={y} className="lane" x1="0" x2="600" y1={y} y2={y} />)}
          <line className="the-line" x1="400" x2="400" y1="12" y2="108" />
          {[[120, 30], [260, 60], [400, 90]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="7" fill="#fff" />)}
          <text className="k" x="408" y="20">The line</text>
        </svg>
      </TrackCard>

      <Card title="Data card">
        <DataTable
          caption="Lap splits for a 4:00 mile"
          columns={[
            { key: 'lap', label: 'Lap', kind: 'q', phone: 'lead' },
            { key: 'at', label: 'Distance', kind: 'em', phone: 'main' },
            { key: 'split', label: 'Split', align: 'r', kind: 'n', phone: 'end' },
            { key: 'total', label: 'Cumulative', align: 'r', kind: 'q', phone: 'endsub' },
          ]}
          rows={rows}
        />
      </Card>

      <Card title="Fields">
        <DataTable
          caption="Miles by day"
          columns={[
            { key: 'day', label: 'Day', kind: 'em', phone: 'main' },
            {
              key: 'miles', label: 'Miles', align: 'r', phone: 'end',
              render: row => (
                <NumberField
                  label={row.day}
                  hideLabel
                  value={miles[row.day]}
                  onChange={next => setMiles(old => ({ ...old, [row.day]: next }))}
                  invalid={Number.isNaN(Number(miles[row.day]))}
                  hint={Number.isNaN(Number(miles[row.day])) ? 'Enter a number of miles.' : undefined}
                />
              ),
            },
          ]}
          rows={Object.keys(miles).map(day => ({ key: day, day }))}
        />
        <FinishLine label="Not reached yet" value="50 mi" off />
      </Card>

      <PillChoice
        legend="Track length"
        name="track"
        value={track}
        onChange={setTrack}
        options={[{ value: '200', label: '200 m' }, { value: '400', label: '400 m' }, { value: 'other', label: 'Other' }]}
      />
    </>
  )
}

function Spark() {
  return (
    <svg width="72" height="24" viewBox="0 0 72 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 20 L18 16 L34 17 L50 9 L70 4" />
    </svg>
  )
}
