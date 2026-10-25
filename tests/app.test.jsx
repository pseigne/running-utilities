import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../src/App'
import { findTool, TOOLS } from '../src/tools'

function goTo(hash) {
  act(() => {
    window.location.hash = hash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

function shown() {
  return [...document.querySelectorAll('main section')].filter(section => !section.hidden).map(section => section.dataset.tool)
}

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
})

describe('tool registry', () => {
  it('finds a tool by its slug and falls back to the first', () => {
    expect(findTool('track-splits').name).toBe('Track Split Calculator')
    expect(findTool('nope')).toBe(TOOLS[0])
    expect(findTool('')).toBe(TOOLS[0])
  })

  it('keeps the slugs that old links use', () => {
    expect(TOOLS.map(tool => tool.slug)).toEqual(['weekly-mileage', 'track-splits'])
  })
})

describe('the page', () => {
  it('opens on the mileage planner with no hash', () => {
    render(<App />)
    expect(shown()).toEqual(['weekly-mileage'])
    expect(screen.getByRole('link', { name: 'Weekly mileage' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Track splits' }).hasAttribute('aria-current')).toBe(false)
    expect(document.title).toBe('Weekly Mileage Planner · Running Utilities')
  })

  it('opens the tool a hash names and follows hash changes', () => {
    window.history.replaceState(null, '', '/#track-splits')
    render(<App />)
    expect(shown()).toEqual(['track-splits'])
    expect(document.title).toBe('Track Split Calculator · Running Utilities')
    goTo('#weekly-mileage')
    expect(shown()).toEqual(['weekly-mileage'])
    goTo('#somewhere-else')
    expect(shown()).toEqual(['weekly-mileage'])
  })

  it('keeps both tools mounted so their inputs survive switching', () => {
    render(<App />)
    expect(document.querySelectorAll('main section')).toHaveLength(TOOLS.length)
    goTo('#track-splits')
    expect(document.querySelectorAll('main section')).toHaveLength(TOOLS.length)
  })

  it('links the switch to each tool’s hash', () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: 'Tools' })
    expect([...nav.querySelectorAll('a')].map(link => link.getAttribute('href'))).toEqual(['#weekly-mileage', '#track-splits'])
  })

  it('skips to the shown tool’s heading without changing the hash', () => {
    window.history.replaceState(null, '', '/#track-splits')
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'Skip to the tool' }))
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Track splits' }))
    expect(window.location.hash).toBe('#track-splits')
  })

  it('sends the portfolio link to the top level and GitHub to a new tab', () => {
    render(<App />)
    const source = document.querySelector('.source')
    expect(source.querySelector('a[href="https://pierceseigne.com/"]').target).toBe('_top')
    const github = source.querySelector('a[href^="https://github.com/"]')
    expect(github.target).toBe('_blank')
    expect(github.rel).toContain('noopener')
  })
})
