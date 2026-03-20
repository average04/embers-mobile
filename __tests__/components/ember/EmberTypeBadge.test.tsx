import React from 'react'
import { render } from '@testing-library/react-native'
import { EmberTypeBadge } from '@/components/ember/EmberTypeBadge'

describe('EmberTypeBadge', () => {
  it('renders the emoji and label for a known type', () => {
    const { getByText } = render(<EmberTypeBadge type="hope" />)
    expect(getByText('✨')).toBeTruthy()
    expect(getByText('Hope')).toBeTruthy()
  })

  it('renders for another known type', () => {
    const { getByText } = render(<EmberTypeBadge type="vents" />)
    expect(getByText('🔥')).toBeTruthy()
    expect(getByText('Vents')).toBeTruthy()
  })

  it('renders a fallback for unknown or null type', () => {
    const { getByTestId } = render(<EmberTypeBadge type={null} />)
    expect(getByTestId('ember-type-badge')).toBeTruthy()
  })
})
