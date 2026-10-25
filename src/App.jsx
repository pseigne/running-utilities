import { lazy, Suspense, useEffect } from 'react'
import { Header } from './kit/Header'
import { PillLinks } from './kit/Pills'
import { Source } from './kit/Source'
import { useHash } from './kit/useHash'
import { findTool, TOOLS } from './tools'

export const SITE_TITLE = 'Running Utilities'

const OUT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
)

// The kit gallery exists on the dev server only; production builds leave it out.
const Gallery = import.meta.env.DEV ? lazy(() => import('./kit/Gallery')) : null

export default function App() {
  const hash = useHash()
  const tool = findTool(hash)
  const gallery = Boolean(Gallery) && hash === 'kit'

  useEffect(() => {
    document.title = `${gallery ? 'Kit' : tool.name} · ${SITE_TITLE}`
  }, [tool, gallery])

  return (
    <>
      <a className="skip" href="#main" onClick={skipToTool}>Skip to the tool</a>
      <Header title={SITE_TITLE} href={`#${TOOLS[0].slug}`}>
        <a className="navlink press" href="https://pierceseigne.com/" target="_top">pierceseigne.com{OUT}</a>
      </Header>
      <div className="wrap">
        <main id="main" tabIndex={-1}>
          <PillLinks
            label="Tools"
            className="toolswitch"
            items={TOOLS.map(item => ({ key: item.slug, label: item.label, href: `#${item.slug}` }))}
            current={tool.slug}
          />
          {gallery && <section data-tool="kit"><Suspense fallback={null}><Gallery /></Suspense></section>}
          {/* every tool stays mounted, so what was typed into one survives a visit to the other */}
          {TOOLS.map(({ slug, Component }) => (
            <section key={slug} data-tool={slug} hidden={gallery || slug !== tool.slug}>
              <Component />
            </section>
          ))}
          <Source>
            Built by <a href="https://pierceseigne.com/" target="_top">Pierce Seigne</a>.
            Source on <a href="https://github.com/pseigne/running-utilities" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </Source>
        </main>
      </div>
    </>
  )
}

// The skip link's own href would change the hash, which picks the tool, so it moves focus itself: to the
// heading of the tool on show.
function skipToTool(click) {
  const heading = document.querySelector('main section:not([hidden]) h1')
  if (!heading) return
  click.preventDefault()
  heading.tabIndex = -1
  heading.focus()
}
