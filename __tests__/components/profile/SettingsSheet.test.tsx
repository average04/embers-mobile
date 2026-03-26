import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { SettingsSheet } from '@/components/profile/SettingsSheet'

// Mock supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}))

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn() }),
}))

// Mock useAuthStore
const mockSetProfile = jest.fn()
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn((selector) =>
    selector({
      session: { user: { id: 'user-1', email: 'test@example.com' } },
      profile: { id: 'user-1', username: 'testuser', embers_hidden: false },
      setProfile: mockSetProfile,
    })
  ),
}))

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
}

describe('SettingsSheet', () => {
  it('renders all setting rows', () => {
    const { getByText } = render(<SettingsSheet {...defaultProps} />)
    expect(getByText('Change username')).toBeTruthy()
    expect(getByText('Change password')).toBeTruthy()
    expect(getByText('Hide my embers from map')).toBeTruthy()
    expect(getByText('Sign out')).toBeTruthy()
  })

  it('expands username input when "Change username" is pressed', () => {
    const { getByText, getByPlaceholderText } = render(<SettingsSheet {...defaultProps} />)
    fireEvent.press(getByText('Change username'))
    expect(getByPlaceholderText('new username')).toBeTruthy()
  })

  it('shows validation error for too-short username', async () => {
    const { getByText, getByPlaceholderText } = render(<SettingsSheet {...defaultProps} />)
    fireEvent.press(getByText('Change username'))
    fireEvent.changeText(getByPlaceholderText('new username'), 'ab')
    fireEvent.press(getByText('Save'))
    await waitFor(() => {
      expect(getByText(/3[–\-]20 chars, letters, numbers and underscores only/i)).toBeTruthy()
    })
  })

  it('calls onClose when sign out is pressed', async () => {
    const onClose = jest.fn()
    const { getByText } = render(<SettingsSheet visible={true} onClose={onClose} />)
    await act(async () => { fireEvent.press(getByText('Sign out')) })
    expect(onClose).toHaveBeenCalled()
  })
})
