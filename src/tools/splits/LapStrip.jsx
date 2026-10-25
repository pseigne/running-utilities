import { useRef } from 'react'
import { useElementSize } from '../../kit/useElementWidth'
import { formatClock, formatMeters } from './model'

const HEIGHT = 120
const LANE = 64
const SIDE = 18
// labels closer than this to the last one shown are left to the table
const GAP = 72
const GAP_UP = 24
const END = 40

// The race as one lane on the track: a white dot where each lap ends, the clock as you pass it and the
// distance, and the finish as the black line. Lying down it runs left to right across the card; standing
// up (beside the table on wide screens) it runs top to bottom and fills the card's height, with the clock
// on the left and the distance on the right. When laps crowd together only some are labelled; the table
// has them all.
export function LapStrip({ rows, distance, standing = false }) {
  const ref = useRef(null)
  const { width, height } = useElementSize(ref, { width: 640, height: 480 })
  const along = standing ? height - END * 2 : width - SIDE * 2
  const at = meters => (standing ? END : SIDE) + along * (meters / distance)
  const finish = rows.at(-1)
  const end = at(finish.at)
  const gap = standing ? GAP_UP : GAP

  // Greedy from the start: label a lap when it has room from the last label (the first from "Start")
  // and from the finish's labels.
  const labelled = new Set()
  let last = at(0)
  rows.slice(0, -1).forEach(row => {
    const p = at(row.at)
    if (p - last >= gap && end - p >= (standing ? gap : gap + 28)) {
      labelled.add(row.key)
      last = p
    }
  })
  const laps = rows.slice(0, -1)

  if (standing) {
    const x = width / 2
    return (
      <div className="strip standing" ref={ref}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <line className="lane" x1={x} x2={x} y1={at(0)} y2={end} />
          <line className="lane" x1={x - 8} x2={x + 8} y1={at(0)} y2={at(0)} />
          <text x={x + 16} y={at(0) + 5}>Start</text>
          {laps.map(row => (
            <g key={row.key} className="move" style={{ transform: `translateY(${at(row.at)}px)` }}>
              <circle cx={x} cy="0" r="5" fill="#fff" />
              {labelled.has(row.key) && (
                <>
                  <text className="k" x={x - 16} y="5" textAnchor="end">{formatClock(row.total)}</text>
                  <text x={x + 16} y="5">{formatMeters(row.at)}</text>
                </>
              )}
            </g>
          ))}
          <line className="the-line" x1={x - 64} x2={x + 64} y1={end} y2={end} />
          <circle cx={x} cy={end} r="6" fill="#151515" stroke="#fff" strokeWidth="2" />
          <text className="k" x={x - 16} y={end + 24} textAnchor="end">{formatClock(finish.total)}</text>
          <text x={x + 16} y={end + 24}>Finish</text>
        </svg>
      </div>
    )
  }

  return (
    <div className="strip" ref={ref}>
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden="true">
        <line className="lane" x1={at(0)} x2={end} y1={LANE} y2={LANE} />
        <line className="lane" x1={at(0)} x2={at(0)} y1={LANE - 8} y2={LANE + 8} />
        <text x={at(0)} y={LANE + 30}>Start</text>
        {laps.map(row => (
          <g key={row.key} className="move" style={{ transform: `translateX(${at(row.at)}px)` }}>
            <circle cx="0" cy={LANE} r="5" fill="#fff" />
            {labelled.has(row.key) && (
              <>
                <text className="k" x="0" y={LANE - 16} textAnchor="middle">{formatClock(row.total)}</text>
                <text x="0" y={LANE + 30} textAnchor="middle">{formatMeters(row.at)}</text>
              </>
            )}
          </g>
        ))}
        <line className="the-line" x1={end} x2={end} y1={LANE - 40} y2={LANE + 14} />
        <circle cx={end} cy={LANE} r="6" fill="#151515" stroke="#fff" strokeWidth="2" />
        <text className="k" x={end - 8} y={LANE - 28} textAnchor="end">{formatClock(finish.total)}</text>
        <text x={end} y={LANE + 30} textAnchor="end">Finish</text>
      </svg>
    </div>
  )
}
