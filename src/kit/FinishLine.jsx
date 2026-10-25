// The line: a red rule with what it is on the left and its figure on the right. Faint when it hasn't been
// reached or doesn't apply yet.
export function FinishLine({ label, value, off = false }) {
  return (
    <div className={`finish${off ? ' off' : ''}`}>
      <span>{label}</span>
      {value != null && <b>{value}</b>}
    </div>
  )
}
