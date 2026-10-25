import { useId } from 'react'

// The black card that holds a screen's answer. Its title and the one number stand on the left; the
// sentence that says what the number means, and anything that acts on it (fields, choices, stats), sit
// in a column on the right on wide screens and under the number on narrower ones.
export function HeroCard({ title, number, lead, children, className = '' }) {
  const id = useId()
  return (
    <section className={`herocard${className ? ` ${className}` : ''}`} aria-labelledby={id}>
      <div className="hero-main">
        <h1 id={id}>{title}</h1>
        {number}
      </div>
      {(lead || children) && (
        <div className="hero-side">
          {lead && <p className="lead">{lead}</p>}
          {children}
        </div>
      )}
    </section>
  )
}

// Detail cards sit in a row and stack on phones.
export function Details({ children }) {
  return <div className="details">{children}</div>
}
