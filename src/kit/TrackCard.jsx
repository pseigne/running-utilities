import { useId } from 'react'

// The orange card for the one picture. Its children draw on it (usually an SVG using the lane and
// the-line classes); the caption says in a sentence what the picture shows. The figure is named by its
// title, or by the caption when it has no title, explicitly, since not every screen reader does that.
export function TrackCard({ title, caption, children, className = '' }) {
  const id = useId()
  const titleId = `${id}-t`
  const captionId = `${id}-c`
  return (
    <figure
      className={`trackcard${className ? ` ${className}` : ''}`}
      aria-labelledby={title ? titleId : caption ? captionId : undefined}
      aria-describedby={title && caption ? captionId : undefined}
    >
      {title && <h2 className="card-t" id={titleId}>{title}</h2>}
      <div className="plot">{children}</div>
      {caption && <figcaption id={captionId}>{caption}</figcaption>}
    </figure>
  )
}
