import { useLayoutEffect, useRef } from 'react'
import { useMedia } from './useMedia'

// The black nav with the track's curb under it: the site's name at left, one control at right. A short
// name, when given, replaces the full one on narrow screens.
export function Header({ title, short, href, children }) {
  const ref = useRef(null)
  // The link is named by whichever title is showing, so the name always holds the visible words.
  const narrow = useMedia('(max-width: 960px)') && Boolean(short)
  // Anything pinned under the nav needs its height. It is watched rather than read once: the first read
  // can come before the fonts have loaded and the nav has its final size.
  useLayoutEffect(() => {
    const root = document.documentElement
    const measure = () => root.style.setProperty('--head', `${ref.current?.offsetHeight || 66}px`)
    measure()
    window.addEventListener('resize', measure)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (ref.current) observer?.observe(ref.current)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [])
  return (
    <header className="top" ref={ref}>
      <a className="mark press" href={href}>
        {short ? (
          <>
            <span className="mark-full" aria-hidden={narrow ? 'true' : undefined}>{title}</span>
            <span className="mark-short" aria-hidden={narrow ? undefined : 'true'}>{short}</span>
          </>
        ) : title}
      </a>
      {children}
    </header>
  )
}
