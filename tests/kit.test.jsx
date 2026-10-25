import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Header } from '../src/kit/Header'
import { PillChoice, PillLinks } from '../src/kit/Pills'

afterEach(cleanup)

describe('Header', () => {
  it('links its title and publishes its height for pinned content', () => {
    render(<Header title="Running Utilities" href="#home"><a href="/x">Right</a></Header>)
    expect(screen.getByRole('link', { name: 'Running Utilities' }).getAttribute('href')).toBe('#home')
    expect(screen.getByRole('link', { name: 'Right' })).toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--head')).toMatch(/px$/)
  })

  it('hides the short title from assistive tech while the full one shows', () => {
    render(<Header title="A long site name" short="Short name" href="#" />)
    expect(screen.getByRole('link', { name: 'A long site name' })).toBeTruthy()
  })
})

describe('PillLinks', () => {
  it('marks only the current item', () => {
    render(<PillLinks label="Gender" current="f" items={[{ key: 'm', label: 'Men', href: '#m' }, { key: 'f', label: 'Women', href: '#f' }]} />)
    expect(screen.getByRole('navigation', { name: 'Gender' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Women' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Men' }).hasAttribute('aria-current')).toBe(false)
  })
})

describe('PillChoice', () => {
  function Distance() {
    const [value, setValue] = useState('800')
    return (
      <PillChoice
        legend="Race distance"
        name="distance"
        value={value}
        onChange={setValue}
        options={[{ value: '800', label: '800 m' }, { value: '1500', label: '1500 m' }]}
      />
    )
  }

  it('is a labelled radio group that follows the choice', () => {
    render(<Distance />)
    expect(screen.getByRole('group', { name: 'Race distance' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: '800 m' }).checked).toBe(true)
    fireEvent.click(screen.getByRole('radio', { name: '1500 m' }))
    expect(screen.getByRole('radio', { name: '1500 m' }).checked).toBe(true)
    expect(screen.getByRole('radio', { name: '800 m' }).checked).toBe(false)
  })
})
