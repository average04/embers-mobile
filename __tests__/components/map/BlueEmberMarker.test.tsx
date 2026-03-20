import React from 'react'
import { render } from '@testing-library/react-native'
import { BlueEmberMarkerView } from '@/components/map/BlueEmberMarker'

describe('BlueEmberMarkerView', () => {
  it('renders unselected state', () => {
    const { getByTestId } = render(<BlueEmberMarkerView selected={false} />)
    expect(getByTestId('blue-ember-marker')).toBeTruthy()
  })

  it('renders selected state with distinct testID', () => {
    const { getByTestId } = render(<BlueEmberMarkerView selected={true} />)
    expect(getByTestId('blue-ember-marker-selected')).toBeTruthy()
  })
})
