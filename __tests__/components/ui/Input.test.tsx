import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders the label', () => {
    const { getByText } = render(<Input label="Email" value="" onChangeText={() => {}} />)
    expect(getByText('Email')).toBeTruthy()
  })

  it('shows error message when provided', () => {
    const { getByText } = render(
      <Input label="Email" value="" onChangeText={() => {}} error="Invalid email" />
    )
    expect(getByText('Invalid email')).toBeTruthy()
  })

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn()
    const { getByDisplayValue } = render(
      <Input label="Email" value="a" onChangeText={onChangeText} />
    )
    fireEvent.changeText(getByDisplayValue('a'), 'ab')
    expect(onChangeText).toHaveBeenCalledWith('ab')
  })
})
