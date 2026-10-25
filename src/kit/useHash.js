import { useEffect, useState } from 'react'

function read() {
  try { return decodeURIComponent(window.location.hash.slice(1)) } catch { return '' }
}

// The page's hash without the #. Links change it, so back and forward work without any routing code.
export function useHash() {
  const [hash, setHash] = useState(read)
  useEffect(() => {
    const update = () => setHash(read())
    window.addEventListener('hashchange', update)
    window.addEventListener('popstate', update)
    return () => {
      window.removeEventListener('hashchange', update)
      window.removeEventListener('popstate', update)
    }
  }, [])
  return hash
}
