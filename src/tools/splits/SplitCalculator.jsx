import { useState } from 'react'
import { Card } from '../../kit/Card'
import { DataTable } from '../../kit/DataTable'
import { HeroCard } from '../../kit/HeroCard'
import { NumberField } from '../../kit/NumberField'
import { PillChoice } from '../../kit/Pills'
import { Stats } from '../../kit/Stats'
import { TrackCard } from '../../kit/TrackCard'
import { useMedia } from '../../kit/useMedia'
import { LapStrip } from './LapStrip'
import {
  DISTANCES, MAX_LAPS, TRACKS, formatClock, formatMeters, formatSplit, raceName, readChoice, readTime, splits,
} from './model'
import { TimeField } from './TimeField'
import './splits.css'

const METRES_HINT = 'Enter metres as a number, like 1200.'

// What to run each lap.
export default function SplitCalculator() {
  const [time, setTime] = useState({ hours: '', minutes: '', seconds: '' })
  const [distance, setDistance] = useState('mile')
  const [customDistance, setCustomDistance] = useState('')
  const [track, setTrack] = useState('400')
  const [customTrack, setCustomTrack] = useState('')

  const goal = readTime(time)
  const race = readChoice(DISTANCES, distance, customDistance)
  const lap = readChoice(TRACKS, track, customTrack)
  const result = goal.seconds && race.meters && lap.meters ? splits(goal.seconds, race.meters, lap.meters) : null
  const name = race.meters ? raceName(distance, race.meters) : null
  const clock = goal.seconds ? formatClock(goal.seconds) : null
  const wide = useMedia('(min-width: 1100px)')

  const columns = [
    { key: 'label', label: 'Lap', kind: 'q', phone: 'lead' },
    { key: 'at', label: 'Distance', kind: 'em', phone: 'main', render: row => formatMeters(row.at) },
    {
      key: 'split', label: 'Split', align: 'r', kind: 'n', phone: 'end',
      render: row => (row.key === 'start' ? <>{formatSplit(row.split)}<span className="tag">{formatMeters(row.meters)}</span></> : formatSplit(row.split)),
    },
    { key: 'total', label: 'Clock', align: 'r', kind: 'q', phone: 'endsub', render: row => formatClock(row.total) },
  ]

  const choices = (
    <div className="choices">
      <div className="choice">
        <span className="choice-l" aria-hidden="true">Race</span>
        <PillChoice legend="Race distance" name="distance" className="wrapping" value={distance} onChange={setDistance} options={DISTANCES} />
        {distance === 'other' && (
          <NumberField
            label="Race distance"
            unit="m"
            value={customDistance}
            onChange={setCustomDistance}
            placeholder="1200"
            invalid={race.reason === 'invalid'}
            hint={race.reason === 'invalid' ? METRES_HINT : undefined}
          />
        )}
      </div>
      <div className="choice">
        <span className="choice-l" aria-hidden="true">Track</span>
        <PillChoice legend="Track length" name="track" value={track} onChange={setTrack} options={TRACKS} />
        {track === 'other' && (
          <NumberField
            label="Track length"
            unit="m"
            value={customTrack}
            onChange={setCustomTrack}
            placeholder="300"
            invalid={lap.reason === 'invalid'}
            hint={lap.reason === 'invalid' ? METRES_HINT : undefined}
          />
        )}
      </div>
    </div>
  )
  const strip = result && (
    <TrackCard title="The race" caption={caption(result)}>
      <LapStrip rows={result.rows} distance={race.meters} standing={wide} />
    </TrackCard>
  )

  return (
    <>
      {/* the time is the answer; the race, the track and the paces it gives sit beside it */}
      <HeroCard
        title="Track splits"
        number={<TimeField {...time} invalid={goal.invalid} onChange={(key, text) => setTime(old => ({ ...old, [key]: text }))} />}
        lead={<Lead goal={goal} race={race} lap={lap} result={result} name={name} clock={clock} />}
      >
        {choices}
        {result && (
          <Stats
            items={[
              { label: 'Per lap', value: formatSplit(result.pace.perLap), accent: true },
              ...(lap.meters !== 400 ? [{ label: 'Per 400 m', value: formatSplit(result.pace.per400) }] : []),
              { label: 'Per km', value: formatClock(result.pace.perKm) },
              { label: 'Per mile', value: formatClock(result.pace.perMile) },
            ]}
          />
        )}
      </HeroCard>

      {/* wide, the race stands up beside the table and stays in view as it scrolls; narrower, it lies
          across the page above it */}
      {result && (
        <div className={`splits-grid${wide ? ' wide' : ''}`}>
          {!wide && strip}
          <Card title="The splits">
            <DataTable
              caption={`Splits for a ${clock} ${name} on a ${formatMeters(lap.meters)} track`}
              columns={columns}
              rows={[...result.rows, { key: 'finish', line: { label: `Finish · ${name}`, value: clock } }]}
            />
          </Card>
          {wide && <div className="rail">{strip}</div>}
        </div>
      )}
    </>
  )
}

// What the page can say from what's been entered, most basic need first.
function Lead({ goal, race, lap, result, name, clock }) {
  if (goal.invalid.hours || goal.invalid.minutes || goal.invalid.seconds) {
    return 'Enter the time as numbers: whole hours and minutes, and seconds with up to two decimals.'
  }
  if (!goal.seconds) return 'Enter a goal time to see the split for every lap.'
  if (!race.meters) return 'Enter the race distance in metres.'
  if (!lap.meters) return 'Enter the track length in metres.'
  if (!result) return `That’s more than ${MAX_LAPS} laps. Check the race distance and the track length.`
  return (
    <>
      {goal.rolled && <>Read as {clock}. </>}
      A {clock} {name} is <b>{formatSplit(result.pace.perLap)} a lap</b> on a {formatMeters(lap.meters)} track.
    </>
  )
}

function caption(result) {
  const dots = `Each dot is a lap and the clock as you pass it, at an even ${formatSplit(result.pace.perLap)} a lap.`
  const start = result.start
    ? ` The start is ${formatMeters(result.start)} round from the line, so the first stretch is short.`
    : ''
  return `${dots}${start} Where laps crowd together, the table has every one.`
}
