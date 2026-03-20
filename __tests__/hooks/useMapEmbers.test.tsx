import { renderHook, waitFor } from '@testing-library/react-native'
import { useMapEmbers } from '@/hooks/useMapEmbers'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    }),
    removeChannel: jest.fn(),
  },
}))

import { supabase } from '@/lib/supabase/client'

const mockRegion = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

const now = new Date().toISOString()
const fakeEmber = {
  id: 'ember-1',
  thought: 'Hello world',
  lat: 14.6,
  lng: 120.98,
  ember_type: 'hope',
  user_id: 'user-1',
  username: 'jay',
  created_at: now,
  relit_at: null,
  relight_count: 0,
  photo_urls: null,
}
const fakeBlueEmber = {
  id: 'blue-1',
  title: 'My audio',
  audio_url: 'https://example.com/audio.m4a',
  audio_duration: 15,
  lat: 14.6,
  lng: 120.98,
  user_id: 'user-1',
  username: 'jay',
  created_at: now,
  relit_at: null,
  relight_count: 0,
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

// Helper: builds a table-aware Supabase from() mock.
function makeFromMock(overrides: { embers?: any[]; blue_embers?: any[] } = {}) {
  const emberData = overrides.embers ?? [fakeEmber]
  const blueData = overrides.blue_embers ?? [fakeBlueEmber]
  return (table: string) => {
    const resolvedData = { data: table === 'embers' ? emberData : blueData, error: null }
    const builder: any = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockImplementation(() => {
        // Return a thenable that also supports further chaining
        const promise = Promise.resolve(resolvedData)
        const chainable: any = Object.assign(promise, {
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockImplementation(() => Promise.resolve(resolvedData)),
          select: jest.fn().mockReturnThis(),
        })
        return chainable
      }),
    }
    return builder
  }
}

describe('useMapEmbers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 1 ember and 1 blueEmber from Supabase', async () => {
    ;(supabase.from as jest.Mock).mockImplementation(makeFromMock())

    const { result } = renderHook(() => useMapEmbers(mockRegion), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.embers).toHaveLength(1)
    expect(result.current.embers[0].id).toBe('ember-1')
    expect(result.current.blueEmbers).toHaveLength(1)
    expect(result.current.blueEmbers[0].id).toBe('blue-1')
  })

  it('filters out orange embers older than 30 days, keeps active blue embers', async () => {
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    const expiredEmber = { ...fakeEmber, created_at: oldDate, relit_at: null }
    ;(supabase.from as jest.Mock).mockImplementation(
      makeFromMock({ embers: [expiredEmber], blue_embers: [fakeBlueEmber] })
    )

    const { result } = renderHook(() => useMapEmbers(mockRegion), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.embers).toHaveLength(0)
    expect(result.current.blueEmbers).toHaveLength(1)
  })

  it('filters out blue embers older than 7 days, keeps active orange embers', async () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    const expiredBlue = { ...fakeBlueEmber, created_at: oldDate, relit_at: null }
    ;(supabase.from as jest.Mock).mockImplementation(
      makeFromMock({ embers: [fakeEmber], blue_embers: [expiredBlue] })
    )

    const { result } = renderHook(() => useMapEmbers(mockRegion), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.blueEmbers).toHaveLength(0)
    expect(result.current.embers).toHaveLength(1)
  })
})
