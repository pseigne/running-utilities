import { useRef } from 'react'
import { useElementWidth } from '../../kit/useElementWidth'
import { formatClock, formatMeters } from './model'

const HEIGHT = 120
const LANE = 64
const SIDE = 18
// labels closer than this to the last one shown are left to the table
const GAP = 72

// The race as one lane on the track: a white dot where each lap ends, the clock as you pass it above and
// the distance below, and the finish as the black line. When laps crowd together only some are labelled;
// the table has them all.
export function LapStrip({ rows, distance }) {
  const ref = useRef(null)
  const width = useElementWidth(ref)
  const xOf = meters => SIDE + (width - SIDE * 2) * (meters / distance)
  const finish = rows.at(-1)
  const finishX = xOf(finish.at)

  // Greedy from the start: label a lap when it has room from the last label (the first from "Start")
  // and from the finish's clock, which is wider and hangs to the left of the line.
  const labelled = new Set()
  let last = xOf(0)
  rows.slice(0, -1).forEach(row => {
    const x = xOf(row.at)
    if (x - last >= GAP && finishX - x >= GAP + 28) {
      labelled.add(row.key)
      last = x
    }
  })

  return (
    <div ref={ref}>
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden="true">
        <line className="lane" x1={xOf(0)} x2={finishX} y1={LANE} y2={LANE} />
        <line className="lane" x1={xOf(0)} x2={xOf(0)} y1={LANE - 8} y2={LANE + 8} />
        <text x={xOf(0)} y={LANE + 30}>Start</text>
        {rows.slice(0, -1).map(row => (
          <g key={row.key} className="move" style={{ transform: `translateX(${xOf(row.at)}px)` }}>
            <circle cx="0" cy={LANE} r="5" fill="#fff" />
            {labelled.has(row.key) && (
              <>
                <text className="k" x="0" y={LANE - 16} textAnchor="middle">{formatClock(row.total)}</text>
                <text x="0" y={LANE + 30} textAnchor="middle">{formatMeters(row.at)}</text>
              </>
            )}
          </g>
        ))}
        <line className="the-line" x1={finishX} x2={finishX} y1={LANE - 40} y2={LANE + 14} />
        <circle cx={finishX} cy={LANE} r="6" fill="#151515" stroke="#fff" strokeWidth="2" />
        <text className="k" x={finishX - 8} y={LANE - 28} textAnchor="end">{formatClock(finish.total)}</text>
        <text x={finishX} y={LANE + 30} textAnchor="end">Finish</text>
      </svg>
    </div>
  )
}

