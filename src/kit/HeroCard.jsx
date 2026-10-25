import { useId } from 'react'

// The black card that holds a screen's answer: its title, the one number, a sentence that says what the
// number means, and anything that explains it further (detail cards) underneath.
export function HeroCard({ title, number, lead, children, className = '' }) {
  const id = useId()
  return (
    <section className={`herocard${className ? ` ${className}` : ''}`} aria-labelledby={id}>
      <h1 id={id}>{title}</h1>
      {(number || lead) && (
        <div className="hero">
          {number}
          {lead && <p className="lead">{lead}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

// Detail cards sit in a row under the number and stack on phones.
export function Details({ children }) {
  return <div className="details">{children}</div>
}
