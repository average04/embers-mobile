import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders the label', () => {
    const { getByText } = render(<Button label="Press me" onPress={() => {}} />)
    expect(getByText('Press me')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Tap" onPress={onPress} />)
    fireEvent.press(getByText('Tap'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Tap" onPress={onPress} disabled />)
    fireEvent.press(getByText('Tap'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows loading indicator when loading=true', () => {
    const { getByTestId } = render(<Button label="Save" onPress={() => {}} loading />)
    expect(getByTestId('button-loading')).toBeTruthy()
  })
})
