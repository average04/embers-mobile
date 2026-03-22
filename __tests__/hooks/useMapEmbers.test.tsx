import { renderHook, waitFor } from '@testing-library/react-native'
import { useMapEmbers } from '@/hooks/useMapEmbers'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockRegion = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

const nowSec = Math.floor(Date.now() / 1000)

// Compact orange format (epoch seconds)
const fakeOrange = {
  ids: ['ember-1'],
  lats: [14.6],
  lngs: [120.98],
  uids: ['user-1'],
  cats: [nowSec],
  rats: [null],
  golden_ids: [],
}

// Blue array format (ISO strings, position tuple)
const fakeBlue = [
  {
    id: 'blue-1',
    position: [14.6, 120.98],
    user_id: 'user-1',
    created_at: new Date().toISOString(),
    relit_at: null,
  },
]

function makeFetchMock(orange = fakeOrange, blue = fakeBlue) {
  return (url: string) => {
    const body = url.includes('/api/blue-embers') ? blue : orange
    return Promise.resolve({
      json: () => Promise.resolve(body),
    })
  }
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useMapEmbers', () => {
  beforeEach(() => {
    global.fetch = jest.fn(makeFetchMock() as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns 1 ember and 1 blueEmber from Supabase', async () => {
    const { result } = renderHook(() => useMapEmbers(mockRegion), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.embers).toHaveLength(1)
    expect(result.current.embers[0].id).toBe('ember-1')
    expect(result.current.blueEmbers).toHaveLength(1)
    expect(result.current.blueEmbers[0].id).toBe('blue-1')
  })

  it('filters out orange embers older than 30 days, keeps active blue embers', async () => {
    const oldSec = Math.floor((Date.now() - 31 * 24 * 60 * 60 * 1000) / 1000)
    const expiredOrange = { ...fakeOrange, cats: [oldSec], rats: [null] }
    global.fetch = jest.fn(makeFetchMock(expiredOrange, fakeBlue) as any)

    const { result } = renderHook(() => useMapEmbers(mockRegion), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.embers).toHaveLength(0)
    expect(result.current.blueEmbers).toHaveLength(1)
  })

  it('filters out blue embers older than 7 days, keeps active orange embers', async () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    const expiredBlue = [{ ...fakeBlue[0], created_at: oldDate, relit_at: null }]
    global.fetch = jest.fn(makeFetchMock(fakeOrange, expiredBlue) as any)

    const { result } = renderHook(() => useMapEmbers(mockRegion), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.blueEmbers).toHaveLength(0)
    expect(result.current.embers).toHaveLength(1)
  })

  it('keeps ember that was relit recently even if created_at is old', async () => {
    const oldSec = Math.floor((Date.now() - 31 * 24 * 60 * 60 * 1000) / 1000)
    const recentSec = Math.floor((Date.now() - 1 * 24 * 60 * 60 * 1000) / 1000)
    const relitOrange = { ...fakeOrange, cats: [oldSec], rats: [recentSec] }
    global.fetch = jest.fn(makeFetchMock(relitOrange, []) as any)

    const { result } = renderHook(() => useMapEmbers(mockRegion), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.embers).toHaveLength(1)
  })
})
