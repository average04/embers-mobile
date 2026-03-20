import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { LocationSearch } from '@/components/map/LocationSearch'

// Mock fetch
global.fetch = jest.fn()

describe('LocationSearch', () => {
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders search input', () => {
    const { getByPlaceholderText } = render(<LocationSearch onSelect={mockOnSelect} />)
    expect(getByPlaceholderText('Search location...')).toBeTruthy()
  })

  it('calls Nominatim API when text is entered', async () => {
    const mockResults = [
      { place_id: 1, display_name: 'Manila, Philippines', lat: '14.5995', lon: '120.9842' },
    ]
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    })

    const { getByPlaceholderText } = render(<LocationSearch onSelect={mockOnSelect} />)
    fireEvent.changeText(getByPlaceholderText('Search location...'), 'Manila')

    // Advance past the 500ms debounce
    await act(async () => {
      jest.advanceTimersByTime(600)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org'),
      expect.any(Object)
    )
  })

  it('calls onSelect with region when result is tapped', async () => {
    const mockResults = [
      { place_id: 1, display_name: 'Manila, Philippines', lat: '14.5995', lon: '120.9842' },
    ]
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    })

    const { getByPlaceholderText, findByText } = render(<LocationSearch onSelect={mockOnSelect} />)
    fireEvent.changeText(getByPlaceholderText('Search location...'), 'Manila')

    await act(async () => {
      jest.advanceTimersByTime(600)
    })

    const result = await findByText('Manila, Philippines')
    fireEvent.press(result)
    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 14.5995, longitude: 120.9842 })
    )
  })
})
