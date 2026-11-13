// A row of figures, each with a quiet label over it and a rule above, as in the NCAA tracker's
// dialogs. One can carry the accent.
export function Stats({ items }) {
  return (
    <dl className="stats">
      {items.map(item => (
        <div key={item.label} className={item.accent ? 'accent' : undefined}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
