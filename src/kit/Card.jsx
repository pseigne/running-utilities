import { useId } from 'react'

// The white card the data sits on. A title, when given, names the section.
export function Card({ title, children, className = '' }) {
  const id = useId()
  return (
    <section className={`card${className ? ` ${className}` : ''}`} aria-labelledby={title ? id : undefined}>
      {title && <h2 className="card-t" id={id}>{title}</h2>}
      {children}
    </section>
  )
}
