// The screen's one number at display size. A unit sits after it, small and quiet; a symbol sits up as a
// footnote mark. With children, the children are the number (an editable mark, for instance).
export function BigNumber({ value, unit, symbol, label, children }) {
  return (
    <p className="num" aria-label={label}>
      {children ?? value}
      {symbol && <span className="sym" aria-hidden="true">{symbol}</span>}
      {unit && <small>{unit}</small>}
    </p>
  )
}
