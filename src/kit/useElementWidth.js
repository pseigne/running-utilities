import { useLayoutEffect, useState } from 'react'

// An element's size in CSS pixels, kept current. Pictures draw at their real size with it, so their
// type stays 14px instead of shrinking with the screen, and a picture can fill the room it's given.
export function useElementSize(ref, fallback = { width: 640, height: 240 }) {
  const [size, setSize] = useState(fallback)
  const { width: fallbackWidth, height: fallbackHeight } = fallback
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const measure = () => setSize(old => {
      const width = element.clientWidth || fallbackWidth
      const height = element.clientHeight || fallbackHeight
      return old.width === width && old.height === height ? old : { width, height }
    })
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, fallbackWidth, fallbackHeight])
  return size
}

export function useElementWidth(ref, fallback = 640) {
  return useElementSize(ref, { width: fallback, height: 0 }).width
}
