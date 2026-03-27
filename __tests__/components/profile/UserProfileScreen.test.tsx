import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query'
import UserProfileScreen from '@/app/user/[id]'

notifyManager.setScheduler(cb => cb())

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'target-user-id' }),
  router: { back: jest.fn(), push: jest.fn() },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn((selector: any) =>
    selector({ session: { user: { id: 'me' } }, profile: null })
  ),
}))

jest.mock('@/components/navigation/BottomTabBar', () => ({
  TAB_BAR_HEIGHT: 62,
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

function setupMocks({ embersHidden = false }: { embersHidden?: boolean } = {}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'target-user-id',
                username: 'mika_void',
                created_at: '2025-01-15T00:00:00Z',
                embers_hidden: embersHidden,
              },
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'embers') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{ id: 'e1', thought: 'hello world', ember_type: 'thought', created_at: '2025-01-15T00:00:00Z', relight_count: 0 }],
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'blue_embers') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }
    }
    // follows table
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ count: 10, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }
  })
}

describe('UserProfileScreen', () => {
  beforeEach(() => setupMocks())
  afterEach(() => jest.clearAllMocks())

  it('renders username after profile loads', async () => {
    const { getByText } = render(<UserProfileScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('@mika_void')).toBeTruthy())
  })

  it('shows embers when embers_hidden is false', async () => {
    const { getByText } = render(<UserProfileScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('hello world')).toBeTruthy())
  })

  it('shows private message when embers_hidden is true', async () => {
    setupMocks({ embersHidden: true })
    const { getByText } = render(<UserProfileScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText("this user's embers are private")).toBeTruthy())
  })
})
