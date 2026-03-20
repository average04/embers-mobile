import { act, renderHook } from '@testing-library/react-native'
import { useAuthStore } from '@/store/authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, profile: null })
  })

  it('starts with null session and profile', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.session).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('setSession updates the session', () => {
    const { result } = renderHook(() => useAuthStore())
    const fakeSession = { user: { id: '123' } } as any
    act(() => result.current.setSession(fakeSession))
    expect(result.current.session).toEqual(fakeSession)
  })

  it('setProfile updates the profile', () => {
    const { result } = renderHook(() => useAuthStore())
    const fakeProfile = { id: '123', username: 'jay', is_moderator: false } as any
    act(() => result.current.setProfile(fakeProfile))
    expect(result.current.profile).toEqual(fakeProfile)
  })

  it('clear resets session and profile to null', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setSession({ user: { id: '123' } } as any)
      result.current.setProfile({ id: '123', username: 'jay' } as any)
    })
    act(() => result.current.clear())
    expect(result.current.session).toBeNull()
    expect(result.current.profile).toBeNull()
  })
})
