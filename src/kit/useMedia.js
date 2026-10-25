import { useEffect, useState } from 'react'

function matches(query) {
  try { return window.matchMedia(query).matches } catch { return false }
}

export function useMedia(query) {
  const [on, setOn] = useState(() => matches(query))
  useEffect(() => {
    let mq
    try { mq = window.matchMedia(query) } catch { return undefined }
    const update = () => setOn(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [query])
  return on
}

export function usePhone() {
  return useMedia('(max-width: 720px)')
}

export function useReduceMotion() {
  return useMedia('(prefers-reduced-motion: reduce)')
}
