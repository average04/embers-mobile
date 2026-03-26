import React from 'react'
import { render } from '@testing-library/react-native'
import { EmberCard } from '@/components/profile/EmberCard'

const base = {
  id: 'e1',
  thought: 'Sometimes I wonder if silence is the loudest answer.',
  ember_type: 'thought',
  created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  relight_count: 7,
}

describe('EmberCard', () => {
  it('renders the thought text', () => {
    const { getByText } = render(<EmberCard ember={base} />)
    expect(getByText(base.thought)).toBeTruthy()
  })

  it('renders the ember type label', () => {
    const { getByText } = render(<EmberCard ember={base} />)
    expect(getByText(/thought/i)).toBeTruthy()
  })

  it('renders the relight count', () => {
    const { getByText } = render(<EmberCard ember={base} />)
    expect(getByText(/7/)).toBeTruthy()
  })

  it('renders without crashing when ember_type is null', () => {
    const { getByText } = render(<EmberCard ember={{ ...base, ember_type: null }} />)
    expect(getByText(base.thought)).toBeTruthy()
    expect(getByText('EMBER')).toBeTruthy()
  })
})
