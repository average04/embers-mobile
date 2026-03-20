import { renderHook, act } from '@testing-library/react-native'
import { useAuth } from '@/hooks/useAuth'

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOtp: jest.fn(),
    },
  },
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn().mockReturnValue({
    clear: jest.fn(),
  }),
}))

import { supabase } from '@/lib/supabase/client'

describe('useAuth', () => {
  beforeEach(() => jest.clearAllMocks())

  it('signIn calls supabase signInWithPassword', async () => {
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { session: { user: { id: '1' } } },
      error: null,
    })
    const { result } = renderHook(() => useAuth())
    const { error } = await act(() => result.current.signIn('test@test.com', 'password'))
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password',
    })
    expect(error).toBeNull()
  })

  it('signIn returns error on failure', async () => {
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Invalid credentials' },
    })
    const { result } = renderHook(() => useAuth())
    const { error } = await act(() => result.current.signIn('test@test.com', 'wrong'))
    expect(error).toBe('Invalid credentials')
  })

  it('signOut calls supabase signOut and clears store', async () => {
    ;(supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({ error: null })
    const { result } = renderHook(() => useAuth())
    await act(() => result.current.signOut())
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('sendMagicLink calls signInWithOtp', async () => {
    ;(supabase.auth.signInWithOtp as jest.Mock).mockResolvedValueOnce({ error: null })
    const { result } = renderHook(() => useAuth())
    const { error } = await act(() => result.current.sendMagicLink('test@test.com'))
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'test@test.com' })
    expect(error).toBeNull()
  })
})
