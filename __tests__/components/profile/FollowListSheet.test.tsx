import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query'
import { FollowListSheet } from '@/components/profile/FollowListSheet'

// Make tanstack query notify synchronously so React state updates happen
// inside act() and don't produce act() warnings in tests.
notifyManager.setScheduler(cb => cb())

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn((selector: any) =>
    selector({ session: { user: { id: 'me' } } })
  ),
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

function setupMocks(users: { id: string; username: string }[]) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ data: users, error: null }),
        }),
      }
    }
    // follows table
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          // Both fields set: followers list reads .follower_id, following list and myFollows read .following_id
          data: users.map(u => ({ follower_id: u.id, following_id: u.id })),
          error: null,
        }),
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
  type: 'followers' as const,
  count: 5,
}

describe('FollowListSheet', () => {
  beforeEach(() => {
    setupMocks([{ id: 'u1', username: 'alice_sparks' }])
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the followers title with count', async () => {
    const { getByText } = render(<FollowListSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('Followers · 5')).toBeTruthy())
  })

  it('renders the following title with count', async () => {
    const { getByText } = render(
      <FollowListSheet {...defaultProps} type="following" count={3} />,
      { wrapper: makeWrapper() }
    )
    await waitFor(() => expect(getByText('Following · 3')).toBeTruthy())
  })

  it('renders username after data loads', async () => {
    const { getByText } = render(<FollowListSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('@alice_sparks')).toBeTruthy())
  })

  it('shows empty message when no users', async () => {
    setupMocks([])
    const { getByText } = render(<FollowListSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('no followers yet')).toBeTruthy())
  })

  it('shows not-following-anyone message for empty following list', async () => {
    setupMocks([])
    const { getByText } = render(
      <FollowListSheet {...defaultProps} type="following" count={0} />,
      { wrapper: makeWrapper() }
    )
    await waitFor(() => expect(getByText('not following anyone yet')).toBeTruthy())
  })
})
