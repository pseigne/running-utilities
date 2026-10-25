import { useLayoutEffect, useState } from 'react'

// An element's width in CSS pixels, kept current. Pictures draw at their real size with it, so their
// type stays 14px instead of shrinking with the screen.
export function useElementWidth(ref, fallback = 640) {
  const [width, setWidth] = useState(fallback)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const measure = () => setWidth(element.clientWidth || fallback)
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, fallback])
  return width
}
