import React from 'react'
import { render } from '@testing-library/react-native'
import { ClusterMarkerView } from '@/components/map/ClusterMarker'

describe('ClusterMarkerView', () => {
  it('renders the count', () => {
    const { getByText } = render(<ClusterMarkerView count={5} />)
    expect(getByText('5')).toBeTruthy()
  })

  it('renders large counts with + suffix', () => {
    const { getByText } = render(<ClusterMarkerView count={150} />)
    expect(getByText('99+')).toBeTruthy()
  })

  it('renders medium count unchanged', () => {
    const { getByText } = render(<ClusterMarkerView count={42} />)
    expect(getByText('42')).toBeTruthy()
  })
})
