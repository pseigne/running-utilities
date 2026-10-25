const ARROW = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

// A small card under the hero's number: a title, a picture to its right, and one line of explanation
// with its key figure in bold. With href or onClick it becomes a link or button ending in "action →".
export function DetailCard({ title, children, spark, action, href, onClick }) {
  const body = (
    <>
      <span className="detail-t">{title}</span>
      {spark && <span className="detail-s" aria-hidden="true">{spark}</span>}
      <span className="detail-x">{children}</span>
      {action && <span className="detail-go">{action}{ARROW}</span>}
    </>
  )
  if (href) return <a className="detail-card press" href={href} onClick={onClick}>{body}</a>
  if (onClick) return <button type="button" className="detail-card press" onClick={onClick}>{body}</button>
  return <div className="detail-card">{body}</div>
}
