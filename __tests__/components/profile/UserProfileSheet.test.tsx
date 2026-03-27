import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query'
import { UserProfileSheet } from '@/components/profile/UserProfileSheet'

notifyManager.setScheduler(cb => cb())

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn((selector: any) =>
    selector({ session: { user: { id: 'me' } } })
  ),
}))

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}))

const mockFrom = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

function setupMocks({ isFollowing = false }: { isFollowing?: boolean } = {}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'u1', username: 'alice_sparks', created_at: '2025-01-01', embers_hidden: false },
              error: null,
            }),
          }),
        }),
      }
    }
    // follows table — handles count queries (head:true) and isFollowing query
    return {
      select: jest.fn().mockImplementation((fields: string, opts?: any) => {
        if (opts?.head) {
          // count query: .select('id', { count: 'exact', head: true }).eq(...)
          return {
            eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
          }
        }
        // isFollowing query: .select('id').eq(...).eq(...).maybeSingle()
        return {
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: isFollowing ? { id: 'f1' } : null,
                error: null,
              }),
            }),
          }),
        }
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }
  })
}

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  userId: 'u1',
  username: 'alice_sparks',
  tabBarHeight: 62,
}

describe('UserProfileSheet', () => {
  beforeEach(() => {
    setupMocks()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders username after data loads', async () => {
    const { getByText } = render(<UserProfileSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('@alice_sparks')).toBeTruthy())
  })

  it('renders follower and following counts', async () => {
    const { getAllByText } = render(<UserProfileSheet {...defaultProps} />, { wrapper: makeWrapper() })
    // count queries return 5 for both; two separate Text nodes each showing '5'
    await waitFor(() => expect(getAllByText('5')).toHaveLength(2))
  })

  it('shows Follow button when not following', async () => {
    const { getByText } = render(<UserProfileSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('Follow')).toBeTruthy())
  })

  it('shows View full profile button', async () => {
    const { getByText } = render(<UserProfileSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('View full profile →')).toBeTruthy())
  })

  it('calls router.push and onClose when View full profile is pressed', async () => {
    const { router } = require('expo-router')
    const onClose = jest.fn()
    const { getByText } = render(
      <UserProfileSheet {...defaultProps} onClose={onClose} />,
      { wrapper: makeWrapper() }
    )
    await waitFor(() => expect(getByText('View full profile →')).toBeTruthy())
    fireEvent.press(getByText('View full profile →'))
    expect(router.push).toHaveBeenCalledWith({ pathname: '/user/[id]', params: { id: 'u1' } })
    expect(onClose).toHaveBeenCalled()
  })

  it('shows Following button when already following', async () => {
    setupMocks({ isFollowing: true })
    const { getByText } = render(<UserProfileSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('Following')).toBeTruthy())
  })
})
