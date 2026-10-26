import { useRef } from 'react'
import { useElementSize } from '../../kit/useElementWidth'
import { DAYS, formatMiles } from './model'

const TOP = 40
const LABELS = 50

// The week on the track: a bar for each day, filled for runs that were entered and outlined for miles
// spread over open days, and the line at the daily average that makes the goal. Bars grow and the line
// slides as the numbers change. It fills the height it's given. Words stay out of the plot, where bars
// and the line would cross them: the line's label sits above with a key, and each day's name and miles
// sit under it. The day fields carry the same numbers for screen readers.
export function WeekChart({ week, spreadDays }) {
  const ref = useRef(null)
  const { width, height } = useElementSize(ref)
  const plot = Math.max(height - TOP - LABELS, 40)
  const values = week.days.map(day => (day.open || day.invalid ? 0 : day.miles))
  const max = Math.max(...values, week.average ?? 0, 1) * 1.08
  const column = width / DAYS.length
  const bar = Math.min(56, column * 0.56)
  const yOf = miles => TOP + plot * (1 - miles / max)
  const base = TOP + plot
  const key = week.average === null ? null : `${formatMiles(week.average)} a day makes ${formatMiles(week.goal)}`

  return (
    <div className="week-chart" ref={ref}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <line className="lane" x1="0" x2={width} y1={base} y2={base} />
        {DAYS.map((day, index) => {
          const x = column * (index + 0.5)
          const miles = values[index]
          const spread = spreadDays.has(index)
          return (
            <g key={day.key}>
              <rect
                className={`bar${spread ? ' spread' : ''}`}
                x={x - bar / 2}
                y={TOP}
                width={bar}
                height={plot}
                style={{ transform: `scaleY(${miles / max})` }}
              />
              <text x={x} y={height - 28} textAnchor="middle">{day.short}</text>
              <text className="k" x={x} y={height - 8} textAnchor="middle">{miles > 0 ? formatMiles(miles) : '–'}</text>
            </g>
          )
        })}
        {key && (
          <>
            <g className="move" style={{ transform: `translateY(${yOf(week.average)}px)` }}>
              <line className="the-line" x1="0" x2={width} y1="0" y2="0" />
            </g>
            <line className="the-line" x1={width - 4} x2={width - 22} y1="15" y2="15" />
            <text className="k" x={width - 30} y="20" textAnchor="end">{key}</text>
          </>
        )}
      </svg>
    </div>
  )
}
