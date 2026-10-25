import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BigNumber } from '../src/kit/BigNumber'
import { Card } from '../src/kit/Card'
import { DataTable } from '../src/kit/DataTable'
import { DetailCard } from '../src/kit/DetailCard'
import { FinishLine } from '../src/kit/FinishLine'
import { Header } from '../src/kit/Header'
import { Details, HeroCard } from '../src/kit/HeroCard'
import { NumberField } from '../src/kit/NumberField'
import { PillChoice, PillLinks } from '../src/kit/Pills'
import { TrackCard } from '../src/kit/TrackCard'

afterEach(cleanup)

describe('HeroCard and BigNumber', () => {
  it('is a section named by its heading, with the number and its lead', () => {
    render(<HeroCard title="Weekly mileage" number={<BigNumber value="26" unit="mi" />} lead="26 to go." />)
    const heading = screen.getByRole('heading', { level: 1, name: 'Weekly mileage' })
    expect(screen.getByRole('region', { name: 'Weekly mileage' }).contains(heading)).toBe(true)
    expect(document.querySelector('.num').textContent).toBe('26mi')
    expect(document.querySelector('.num small').textContent).toBe('mi')
    expect(document.querySelector('.lead').textContent).toBe('26 to go.')
  })

  it('leaves out the number row when there is nothing for it', () => {
    render(<HeroCard title="Empty" />)
    expect(document.querySelector('.hero')).toBeNull()
  })

  it('takes children as the number and hides the symbol from screen readers', () => {
    render(<BigNumber symbol="*" label="About 4 minutes">4:00</BigNumber>)
    const num = document.querySelector('.num')
    expect(num.getAttribute('aria-label')).toBe('About 4 minutes')
    expect(num.querySelector('.sym').getAttribute('aria-hidden')).toBe('true')
  })

  it('lays detail cards out together', () => {
    render(<Details><DetailCard title="A">a</DetailCard><DetailCard title="B">b</DetailCard></Details>)
    expect(document.querySelectorAll('.details > .detail-card')).toHaveLength(2)
  })
})

describe('Card and TrackCard', () => {
  it('names a card by its title, and needs none', () => {
    render(<><Card title="The days"><p>rows</p></Card><Card><p>bare</p></Card></>)
    expect(screen.getByRole('region', { name: 'The days' })).toBeTruthy()
    expect(document.querySelectorAll('.card')).toHaveLength(2)
    expect(document.querySelectorAll('.card h2')).toHaveLength(1)
  })

  it('is a figure named by its title and described by its caption', () => {
    render(<TrackCard title="The week" caption="Seven days on the track."><svg /></TrackCard>)
    const figure = screen.getByRole('figure', { name: 'The week' })
    expect(document.getElementById(figure.getAttribute('aria-describedby')).textContent).toBe('Seven days on the track.')
    expect(screen.getByRole('heading', { level: 2, name: 'The week' })).toBeTruthy()
    expect(document.querySelector('.trackcard .plot svg')).toBeTruthy()
  })

  it('is named by its caption when it has no title', () => {
    render(<TrackCard caption="Seven days on the track."><svg /></TrackCard>)
    const figure = screen.getByRole('figure', { name: 'Seven days on the track.' })
    expect(figure.hasAttribute('aria-describedby')).toBe(false)
  })
})

describe('FinishLine', () => {
  it('shows what the line is and its figure', () => {
    render(<FinishLine label="Goal" value="50 mi" />)
    const line = document.querySelector('.finish')
    expect(line.textContent).toBe('Goal50 mi')
    expect(line.classList.contains('off')).toBe(false)
  })

  it('fades when off and can go without a figure', () => {
    render(<FinishLine label="No goal yet" off />)
    const line = document.querySelector('.finish')
    expect(line.classList.contains('off')).toBe(true)
    expect(line.querySelector('b')).toBeNull()
  })
})

describe('DataTable', () => {
  const columns = [
    { key: 'lap', label: 'Lap', kind: 'q', phone: 'lead' },
    { key: 'split', label: 'Split', align: 'r', kind: 'n', phone: 'end' },
    { key: 'note', label: 'Note', render: row => <i>{row.lap} done</i> },
  ]
  const rows = [
    { key: 1, lap: 1, split: '59.65' },
    { key: 'line', line: { label: 'Goal', value: '4:00.00' } },
    { key: 2, lap: 2, split: '59.65', className: 'last' },
  ]

  it('heads each column and fills cells from fields or render', () => {
    render(<DataTable caption="Splits" columns={columns} rows={rows} />)
    expect(screen.getByRole('table', { name: 'Splits' })).toBeTruthy()
    expect(screen.getAllByRole('columnheader').map(th => th.textContent)).toEqual(['Lap', 'Split', 'Note'])
    expect(screen.getAllByRole('columnheader')[1].className).toBe('r')
    const first = document.querySelector('tbody tr[data-row]')
    expect([...first.cells].map(td => td.textContent)).toEqual(['1', '59.65', '1 done'])
  })

  it('carries how each cell reads and where it goes on phones', () => {
    render(<DataTable caption="Splits" columns={columns} rows={rows} />)
    const [lap, split, note] = document.querySelector('tbody tr[data-row]').cells
    expect(lap.className).toBe('q')
    expect(lap.dataset.phone).toBe('lead')
    expect(split.className).toBe('n r')
    expect(split.dataset.phone).toBe('end')
    expect(note.hasAttribute('class')).toBe(false)
  })

  it('draws the line across the table where a row asks for it', () => {
    render(<DataTable caption="Splits" columns={columns} rows={rows} />)
    const body = [...document.querySelector('tbody').rows]
    expect(body.map(tr => tr.className)).toEqual(['', 'line', 'last'])
    expect(body[1].cells[0].colSpan).toBe(3)
    expect(body[1].querySelector('.finish').textContent).toBe('Goal4:00.00')
  })

  it('shows the caption when asked', () => {
    render(<DataTable caption="Splits" captionHidden={false} columns={columns} rows={[]} />)
    expect(document.querySelector('caption').className).toBe('dt-cap')
  })
})

describe('NumberField', () => {
  it('is labelled and reports the typed text as it is', () => {
    const onChange = vi.fn()
    render(<NumberField label="Weekly goal" value="" onChange={onChange} unit="mi" />)
    const input = screen.getByRole('textbox', { name: 'Weekly goal' })
    expect(input.getAttribute('inputmode')).toBe('decimal')
    fireEvent.change(input, { target: { value: '5.' } })
    expect(onChange).toHaveBeenCalledWith('5.')
    expect(document.querySelector('.field-u').textContent).toBe('mi')
  })

  it('says why a value is wrong and ties the hint to the input', () => {
    render(<NumberField label="Monday" value="x" onChange={() => {}} invalid hint="Enter a number of miles." />)
    const input = screen.getByRole('textbox', { name: 'Monday' })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Enter a number of miles.').id).toBe(input.getAttribute('aria-describedby'))
  })

  it('keeps a hidden label in the accessible name, and has a big version', () => {
    render(<NumberField label="Tuesday" value="4" onChange={() => {}} hideLabel big />)
    expect(screen.getByRole('textbox', { name: 'Tuesday' }).value).toBe('4')
    expect(document.querySelector('label').className).toBe('vh')
    expect(document.querySelector('.field').classList.contains('big')).toBe(true)
  })
})

describe('DetailCard', () => {
  it('is plain text with no link or handler', () => {
    render(<DetailCard title="Per 400 m">A 4:00 mile is <b>59.65</b> a lap.</DetailCard>)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(document.querySelector('.detail-x b').textContent).toBe('59.65')
  })

  it('becomes a link or a button that ends in its action', () => {
    const onClick = vi.fn()
    render(<><DetailCard title="Season" action="Day by day" href="#season">x</DetailCard><DetailCard title="Past" action="Every season" onClick={onClick}>y</DetailCard></>)
    expect(screen.getByRole('link', { name: /Day by day/ }).getAttribute('href')).toBe('#season')
    fireEvent.click(screen.getByRole('button', { name: /Every season/ }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})

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
