import { act, renderHook } from '@testing-library/react-native'
import { useNotifStore } from '@/store/notifStore'

describe('notifStore', () => {
  beforeEach(() => {
    useNotifStore.setState({ unreadCount: 0 })
  })

  it('starts at zero', () => {
    const { result } = renderHook(() => useNotifStore())
    expect(result.current.unreadCount).toBe(0)
  })

  it('increment increases count by 1', () => {
    const { result } = renderHook(() => useNotifStore())
    act(() => result.current.increment())
    act(() => result.current.increment())
    expect(result.current.unreadCount).toBe(2)
  })

  it('reset sets count to 0', () => {
    const { result } = renderHook(() => useNotifStore())
    act(() => result.current.increment())
    act(() => result.current.reset())
    expect(result.current.unreadCount).toBe(0)
  })
})
