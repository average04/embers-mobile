import React from 'react'
import { render } from '@testing-library/react-native'
import { BlueEmberCard } from '@/components/profile/BlueEmberCard'

const base = {
  id: 'b1',
  title: 'A quiet evening on the rooftop',
  audio_duration: 93,
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  relight_count: 4,
}

describe('BlueEmberCard', () => {
  it('renders the title', () => {
    const { getByText } = render(<BlueEmberCard blueEmber={base} />)
    expect(getByText(base.title)).toBeTruthy()
  })

  it('formats audio_duration as m:ss', () => {
    const { getByText } = render(<BlueEmberCard blueEmber={base} />)
    expect(getByText('1:33')).toBeTruthy()
  })

  it('formats sub-minute duration as 0:ss', () => {
    const { getByText } = render(<BlueEmberCard blueEmber={{ ...base, audio_duration: 45 }} />)
    expect(getByText('0:45')).toBeTruthy()
  })

  it('renders the relight count', () => {
    const { getByText } = render(<BlueEmberCard blueEmber={base} />)
    expect(getByText(/4 relights/)).toBeTruthy()
  })
})
