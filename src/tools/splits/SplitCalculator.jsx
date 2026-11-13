import { useId, useState } from 'react'
import { Card } from '../../kit/Card'
import { DataTable } from '../../kit/DataTable'
import { NumberField } from '../../kit/NumberField'
import { PillChoice } from '../../kit/Pills'
import {
  DISTANCES, TRACKS, formatClock, formatMeters, formatSplit, raceName, readChoice, readTime, splits,
} from './model'
import { TimeField } from './TimeField'
import './splits.css'

// The original calculator's layout: one centred card that asks for the target time, the race and the
// track, top to bottom, with the splits in a table under it.
export default function SplitCalculator() {
  const [time, setTime] = useState({ hours: '', minutes: '', seconds: '' })
  const [distance, setDistance] = useState('mile')
  const [customDistance, setCustomDistance] = useState('')
  const [track, setTrack] = useState('400')
  const [customTrack, setCustomTrack] = useState('')
  const id = useId()

  const goal = readTime(time)
  const race = readChoice(DISTANCES, distance, customDistance)
  const lap = readChoice(TRACKS, track, customTrack)
  const result = goal.seconds && race.meters && lap.meters ? splits(goal.seconds, race.meters, lap.meters) : null
  const name = race.meters ? raceName(distance, race.meters) : null
  const clock = goal.seconds ? formatClock(goal.seconds) : null

  const columns = [
    { key: 'label', label: 'Lap', kind: 'q', phone: 'lead' },
    { key: 'at', label: 'Distance', kind: 'em', phone: 'main', render: row => formatMeters(row.at) },
    {
      key: 'split', label: 'Split', align: 'r', kind: 'n', phone: 'end',
      render: row => (row.key === 'start' ? <>{formatSplit(row.split)}<span className="tag">{formatMeters(row.meters)}</span></> : formatSplit(row.split)),
    },
    { key: 'total', label: 'Cumulative', align: 'r', kind: 'q', phone: 'endsub', render: row => formatClock(row.total) },
  ]

  return (
    <div className="splits">
      <section className="herocard splits-card" aria-labelledby={id}>
        <h1 id={id}>Track Split Calculator</h1>

        <h2 className="ask">Target time</h2>
        <TimeField {...time} invalid={goal.invalid} onChange={(key, text) => setTime(old => ({ ...old, [key]: text }))} />

        <h2 className="ask">Race distance</h2>
        <PillChoice legend="Race distance" name="distance" className="wrapping" value={distance} onChange={setDistance} options={DISTANCES} />
        {distance === 'other' && (
          <NumberField
            label="Custom distance"
            unit="m"
            value={customDistance}
            onChange={setCustomDistance}
            placeholder="1200"
            invalid={race.reason === 'invalid'}
            className="custom"
          />
        )}

        <p className="ask-small" aria-hidden="true">Track length</p>
        <PillChoice legend="Track length" name="track" className="even" value={track} onChange={setTrack} options={TRACKS} />
        {track === 'other' && (
          <NumberField
            label="Track length"
            unit="m"
            value={customTrack}
            onChange={setCustomTrack}
            placeholder="300"
            invalid={lap.reason === 'invalid'}
            className="custom"
          />
        )}

        {result && <p className="lead">Scroll to see splits</p>}
      </section>

      {result && (
        <Card className="splits-table">
          <DataTable
            caption={`Splits for a ${clock} ${name} on a ${formatMeters(lap.meters)} track`}
            columns={columns}
            rows={[...result.rows, { key: 'finish', line: { label: `Finish · ${name}`, value: clock } }]}
          />
        </Card>
      )}
    </div>
  )
}
