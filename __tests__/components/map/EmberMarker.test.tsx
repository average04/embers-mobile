import React from 'react'
import { render } from '@testing-library/react-native'
import { EmberMarkerView } from '@/components/map/EmberMarker'

describe('EmberMarkerView', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<EmberMarkerView selected={false} />)
    expect(getByTestId('ember-marker')).toBeTruthy()
  })

  it('renders selected state', () => {
    const { getByTestId } = render(<EmberMarkerView selected={true} />)
    expect(getByTestId('ember-marker-selected')).toBeTruthy()
  })
})
