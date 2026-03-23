# Embers Mobile — Phase 2: Map & Ember Viewing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full-screen live map with orange and blue ember markers, supercluster-based clustering, Nominatim location search, and tap-to-view ember detail sheets — replacing the Phase 1 placeholder.

**Architecture:** `useMapEmbers` queries Supabase directly with viewport bounds and filters expired embers client-side. `supercluster` clusters the combined orange + blue features; the map screen drives clustering on every `onRegionChangeComplete`. Tapping a marker sets `selectedEmberId` + `selectedEmberType` in `mapStore`, which triggers a detail bottom sheet rendered as a `Modal`. Reactions, comments, and relights are Phase 4 — the detail sheet is read-only in this phase.

**Tech Stack:** react-native-maps 1.27.2, supercluster 8.0.1 + @types/supercluster 7.1.3, expo-av (audio playback), expo-location (user position), @tanstack/react-query v5, Nominatim OpenStreetMap (free geocoding)

---

> **This is Phase 2 of 6.** Full plan sequence:
> - Phase 1 (complete): Foundation — repo, auth, navigation shell, stores
> - **Phase 2 (this plan):** Map & Ember Viewing — react-native-maps, markers, clustering, ember detail
> - Phase 3: Ember Creation — text/audio posts, photo upload, image crop
> - Phase 4: Feed & Social — feed, profiles, follows, reactions, comments, relights
> - Phase 5: Notifications & Push — in-app notifs, push_tokens table, Supabase Edge Function
> - Phase 6: Moderator, Settings & Deployment — mod panel, settings, deep links, EAS build
>
> Do not start Phase 3 until Phase 2 is fully working on a real device or simulator.

---

## Prerequisites

Before starting, gather:
1. **Google Maps API key** (required for Android react-native-maps). Get one from Google Cloud Console → Maps SDK for Android. This is free for development.
2. **Supabase credentials** — already in `.env.local` from Phase 1.

---

## File Map

**Created in this phase:**

```
embers-mobile/
├── hooks/
│   └── useMapEmbers.ts              # Viewport bounds query — both orange + blue embers
├── components/
│   ├── map/
│   │   ├── EmberMarker.tsx          # Orange ember pin (custom <Marker> view)
│   │   ├── BlueEmberMarker.tsx      # Blue ember pin (custom <Marker> view)
│   │   ├── ClusterMarker.tsx        # Cluster count bubble
│   │   └── LocationSearch.tsx       # Nominatim geocoding search bar
│   ├── ember/
│   │   ├── EmberTypeBadge.tsx       # Pill badge: emoji + type label
│   │   ├── EmberDetailSheet.tsx     # Orange ember detail bottom sheet (Modal)
│   │   └── BlueEmberDetailSheet.tsx # Blue ember detail with audio player
│   └── audio/
│       └── AudioPlayer.tsx          # expo-av play/pause with progress
├── __tests__/
│   ├── hooks/
│   │   └── useMapEmbers.test.ts
│   ├── components/
│   │   ├── map/
│   │   │   ├── EmberMarker.test.tsx
│   │   │   ├── BlueEmberMarker.test.tsx
│   │   │   ├── ClusterMarker.test.tsx
│   │   │   └── LocationSearch.test.tsx
│   │   ├── ember/
│   │   │   └── EmberTypeBadge.test.tsx
│   │   └── audio/
│   │       └── AudioPlayer.test.tsx
```

**Modified in this phase:**

```
embers-mobile/
├── app.config.ts                    # Create: dynamic Expo config (extends app.json, injects Google Maps key)
├── .env.example                     # Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
├── store/mapStore.ts                # Add selectedEmberType field
├── __tests__/store/mapStore.test.ts # Add tests for selectedEmberType
└── app/(tabs)/map.tsx               # Replace placeholder with full map screen
```

**Also created:**

```
embers-mobile/
└── lib/
    └── emberUtils.ts                # Shared daysRemaining() helper
```

**Not in this phase (deferred):**
- `app/ember/[id].tsx` — deep-link screen (Phase 6)
- Reactions, comments, relights on detail sheet (Phase 4)
- `hooks/useEmberData.ts`, `hooks/useBlueEmberData.ts` — feed hooks (Phase 4)

---

## Ember Data Shapes

These types are used throughout Phase 2. Reference the Supabase types in `lib/supabase/types.ts` — do not redefine them; use the `Database` types directly.

```ts
// Orange ember as returned by useMapEmbers.
// Nullability matches the DB schema in lib/supabase/types.ts.
type MapEmber = {
  id: string
  thought: string
  lat: number
  lng: number
  ember_type: string | null   // DB allows null; narrow to EmberType before using EMBER_TYPE_INFO
  user_id: string | null      // DB allows null
  username: string | null     // DB allows null
  created_at: string
  relit_at: string | null
  relight_count: number       // NOT NULL in DB (default 0)
  photo_urls: string[] | null // Added via migration; may be null for older embers
}

// Blue ember as returned by useMapEmbers.
// Nullability matches the DB schema in lib/supabase/types.ts.
type MapBlueEmber = {
  id: string
  title: string               // NOT NULL in DB
  audio_url: string           // NOT NULL in DB
  audio_duration: number      // NOT NULL in DB
  lat: number
  lng: number
  user_id: string | null
  username: string | null
  created_at: string
  relit_at: string | null
  relight_count: number       // NOT NULL in DB (default 0)
}
```

---

## Task 1: Configure react-native-maps for Android + update mapStore

**Files:**
- Modify: `app.json`
- Modify: `.env.example`
- Modify: `store/mapStore.ts`
- Modify: `__tests__/store/mapStore.test.ts`

### Step 1.1 — Add Google Maps API key to .env.example

Open `.env.example` and add:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

Then add it to your `.env.local` as well with your actual key.

### Step 1.2 — Create app.config.ts to inject Google Maps API key

`app.json` does not support environment variable expansion. Instead, create a dynamic config file `app.config.ts` at the project root that extends `app.json` and injects the key at build time.

Create `app.config.ts`:

```ts
import type { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  android: {
    ...config.android,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
})
```

> **Why `app.config.ts` not `app.json`:** Static `app.json` cannot read environment variables. `app.config.ts` is the Expo-recommended way to inject secrets at build time. When both files exist, Expo uses `app.config.ts` as the authoritative config and merges `app.json` as the base via the `config` argument. The `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` is read automatically by Expo CLI during `npx expo start` and EAS Build.

> **iOS note:** iOS uses Apple Maps by default — no API key required. The `app.config.ts` change only affects Android builds.

### Step 1.3 — Write failing tests for mapStore selectedEmberType

Open `__tests__/store/mapStore.test.ts`. Add these two tests after the existing 4:

```ts
it('starts with no selectedEmberType', () => {
  const { result } = renderHook(() => useMapStore())
  expect(result.current.selectedEmberType).toBeNull()
})

it('setSelectedEmber sets id and type together', () => {
  const { result } = renderHook(() => useMapStore())
  act(() => result.current.setSelectedEmber('ember-abc', 'orange'))
  expect(result.current.selectedEmberId).toBe('ember-abc')
  expect(result.current.selectedEmberType).toBe('orange')
})

it('setSelectedEmber with null clears both id and type', () => {
  const { result } = renderHook(() => useMapStore())
  act(() => result.current.setSelectedEmber('ember-abc', 'orange'))
  act(() => result.current.setSelectedEmber(null, null))
  expect(result.current.selectedEmberId).toBeNull()
  expect(result.current.selectedEmberType).toBeNull()
})
```

**Replace** the existing `beforeEach` block (there should be one already from Phase 1) with this updated version that also resets `selectedEmberType`:

```ts
beforeEach(() => {
  useMapStore.setState({ region: DEFAULT_REGION, selectedEmberId: null, selectedEmberType: null })
})
```

- [ ] **Step 1.4: Run tests to verify they fail**

```bash
cd D:\Projects\embers-mobile && npm test -- mapStore
```

Expected: FAIL — `selectedEmberType` is not in the store yet.

- [ ] **Step 1.5: Update mapStore**

Replace `store/mapStore.ts`:

```ts
import { create } from 'zustand'

interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

const DEFAULT_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

interface MapState {
  region: Region
  selectedEmberId: string | null
  selectedEmberType: 'orange' | 'blue' | null
  setRegion: (region: Region) => void
  setSelectedEmberId: (id: string | null) => void   // kept for backward compat
  setSelectedEmber: (id: string | null, type: 'orange' | 'blue' | null) => void
}

export const useMapStore = create<MapState>((set) => ({
  region: DEFAULT_REGION,
  selectedEmberId: null,
  selectedEmberType: null,
  setRegion: (region) => set({ region }),
  setSelectedEmberId: (selectedEmberId) => set({ selectedEmberId }),
  setSelectedEmber: (selectedEmberId, selectedEmberType) =>
    set({ selectedEmberId, selectedEmberType }),
}))
```

- [ ] **Step 1.6: Run tests to verify they pass**

```bash
npm test -- mapStore
```

Expected: PASS — all 7 mapStore tests pass.

- [ ] **Step 1.7: Commit**

```bash
git add app.config.ts .env.example store/mapStore.ts __tests__/store/mapStore.test.ts
git commit -m "feat: add app.config.ts with google maps key, add selectedEmberType to mapStore"
```

---

## Task 2: useMapEmbers hook

**Files:**
- Create: `hooks/useMapEmbers.ts`
- Create: `__tests__/hooks/useMapEmbers.test.ts`

The hook fetches both orange and blue embers within the map viewport, filters out expired ones, and returns them for rendering.

- [ ] **Step 2.1: Write failing tests**

Create `__tests__/hooks/useMapEmbers.test.ts`:

```ts
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
  relight_count: 0,   // number, not null
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

// Helper: builds a table-aware Supabase from() mock.
// Returns different data depending on which table is queried.
function makeFromMock(overrides: { embers?: any[]; blue_embers?: any[] } = {}) {
  const emberData = overrides.embers ?? [fakeEmber]
  const blueData = overrides.blue_embers ?? [fakeBlueEmber]
  return (table: string) => ({
    select: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockResolvedValue({
      data: table === 'embers' ? emberData : blueData,
      error: null,
    }),
  })
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
    expect(result.current.blueEmbers).toHaveLength(1) // blue is still active
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
    expect(result.current.embers).toHaveLength(1) // orange is still active
  })
})
```

- [ ] **Step 2.2: Run to verify failure**

```bash
npm test -- useMapEmbers
```

Expected: FAIL — `useMapEmbers` module not found.

- [ ] **Step 2.3: Implement useMapEmbers**

Create `hooks/useMapEmbers.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

export type MapEmber = {
  id: string
  thought: string
  lat: number
  lng: number
  ember_type: string | null    // DB allows null; narrow before using EMBER_TYPE_INFO
  user_id: string | null
  username: string | null
  created_at: string
  relit_at: string | null
  relight_count: number        // NOT NULL in DB (default 0)
  photo_urls: string[] | null
}

export type MapBlueEmber = {
  id: string
  title: string                // NOT NULL in DB
  audio_url: string            // NOT NULL in DB
  audio_duration: number       // NOT NULL in DB
  lat: number
  lng: number
  user_id: string | null
  username: string | null
  created_at: string
  relit_at: string | null
  relight_count: number        // NOT NULL in DB (default 0)
}

const ORANGE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000
const BLUE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

function isActive(createdAt: string, relitAt: string | null, expiryMs: number): boolean {
  const lastActive = relitAt
    ? Math.max(new Date(createdAt).getTime(), new Date(relitAt).getTime())
    : new Date(createdAt).getTime()
  return Date.now() - lastActive < expiryMs
}

async function fetchMapEmbers(region: Region) {
  const south = region.latitude - region.latitudeDelta / 2
  const north = region.latitude + region.latitudeDelta / 2
  const west = region.longitude - region.longitudeDelta / 2
  const east = region.longitude + region.longitudeDelta / 2

  const [embersResult, blueEmbersResult] = await Promise.all([
    supabase
      .from('embers')
      .select('id, thought, lat, lng, ember_type, user_id, username, created_at, relit_at, relight_count, photo_urls')
      .gte('lat', south)
      .lte('lat', north)
      .gte('lng', west)
      .lte('lng', east),
    supabase
      .from('blue_embers')
      .select('id, title, audio_url, audio_duration, lat, lng, user_id, username, created_at, relit_at, relight_count')
      .gte('lat', south)
      .lte('lat', north)
      .gte('lng', west)
      .lte('lng', east),
  ])

  const embers: MapEmber[] = (embersResult.data ?? []).filter((e) =>
    isActive(e.created_at, e.relit_at, ORANGE_EXPIRY_MS)
  )

  const blueEmbers: MapBlueEmber[] = (blueEmbersResult.data ?? []).filter((b) =>
    isActive(b.created_at, b.relit_at, BLUE_EXPIRY_MS)
  )

  return { embers, blueEmbers }
}

export function useMapEmbers(region: Region) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'mapEmbers',
      // Round to 3 decimal places (~100m) to avoid thrashing on minor pan
      Math.round(region.latitude * 1000) / 1000,
      Math.round(region.longitude * 1000) / 1000,
      Math.round(region.latitudeDelta * 1000) / 1000,
    ],
    queryFn: () => fetchMapEmbers(region),
    staleTime: 30_000,   // Refetch after 30s of staleness
    gcTime: 120_000,
  })

  return {
    embers: data?.embers ?? [],
    blueEmbers: data?.blueEmbers ?? [],
    isLoading,
    error,
    refetch,
  }
}
```

- [ ] **Step 2.4: Run tests to verify they pass**

```bash
npm test -- useMapEmbers
```

Expected: PASS (or near-pass — the Supabase mock chaining is complex; at minimum the module must import and the expiry filter tests must pass).

- [ ] **Step 2.5: Commit**

```bash
git add hooks/useMapEmbers.ts __tests__/hooks/useMapEmbers.test.ts
git commit -m "feat: add useMapEmbers hook with viewport bounds query and expiry filtering"
```

---

## Task 3: EmberMarker and BlueEmberMarker components

**Files:**
- Create: `components/map/EmberMarker.tsx`
- Create: `components/map/BlueEmberMarker.tsx`
- Create: `__tests__/components/map/EmberMarker.test.tsx`
- Create: `__tests__/components/map/BlueEmberMarker.test.tsx`

These are custom view components rendered inside react-native-maps `<Marker>`. They are just styled views — no map-specific logic — so they are straightforward to test.

> **Why custom views not default pins:** Custom views let us control the visual style (colored dots matching the web app) and future-proof adding type colors, glow effects, etc. without touching the map screen.

- [ ] **Step 3.1: Write failing tests**

Create `__tests__/components/map/EmberMarker.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { EmberMarkerView } from '@/components/map/EmberMarker'

describe('EmberMarkerView', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<EmberMarkerView selected={false} />)
    expect(getByTestId('ember-marker')).toBeTruthy()
  })

  it('renders selected state', () => {
    const { getByTestId } = render(<EmberMarkerView selected={true} />)
    expect(getByTestId('ember-marker-selected')).toBeTruthy()
  })
})
```

Create `__tests__/components/map/BlueEmberMarker.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { BlueEmberMarkerView } from '@/components/map/BlueEmberMarker'

describe('BlueEmberMarkerView', () => {
  it('renders unselected state', () => {
    const { getByTestId } = render(<BlueEmberMarkerView selected={false} />)
    expect(getByTestId('blue-ember-marker')).toBeTruthy()
  })

  it('renders selected state with distinct testID', () => {
    const { getByTestId } = render(<BlueEmberMarkerView selected={true} />)
    expect(getByTestId('blue-ember-marker-selected')).toBeTruthy()
  })
})
```

- [ ] **Step 3.2: Run to verify failure**

```bash
npm test -- EmberMarker BlueEmberMarker
```

Expected: FAIL — modules not found.

- [ ] **Step 3.3: Implement EmberMarker**

Create `components/map/EmberMarker.tsx`:

```tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'

interface EmberMarkerViewProps {
  selected: boolean
}

/** The visual dot rendered inside a react-native-maps <Marker> for orange embers. */
export function EmberMarkerView({ selected }: EmberMarkerViewProps) {
  if (selected) {
    return (
      <View testID="ember-marker-selected" style={styles.selectedOuter}>
        <View style={styles.selectedInner} />
      </View>
    )
  }
  return <View testID="ember-marker" style={styles.dot} />
}

const styles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f97316',  // orange-500
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectedOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f97316',
    borderWidth: 2,
    borderColor: '#fff',
  },
})
```

- [ ] **Step 3.4: Implement BlueEmberMarker**

Create `components/map/BlueEmberMarker.tsx`:

```tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'

interface BlueEmberMarkerViewProps {
  selected: boolean
}

/** The visual dot rendered inside a react-native-maps <Marker> for blue (audio) embers. */
export function BlueEmberMarkerView({ selected }: BlueEmberMarkerViewProps) {
  if (selected) {
    return (
      <View testID="blue-ember-marker-selected" style={styles.selectedOuter}>
        <View style={styles.selectedInner} />
      </View>
    )
  }
  return <View testID="blue-ember-marker" style={styles.dot} />
}

const styles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#60a5fa',  // blue-400
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectedOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#60a5fa',
    borderWidth: 2,
    borderColor: '#fff',
  },
})
```

- [ ] **Step 3.5: Run tests**

```bash
npm test -- EmberMarker BlueEmberMarker
```

Expected: PASS — 3 tests across 2 suites.

- [ ] **Step 3.6: Commit**

```bash
git add components/map/EmberMarker.tsx components/map/BlueEmberMarker.tsx \
  __tests__/components/map/EmberMarker.test.tsx __tests__/components/map/BlueEmberMarker.test.tsx
git commit -m "feat: add EmberMarker and BlueEmberMarker custom map pin components"
```

---

## Task 4: ClusterMarker component

**Files:**
- Create: `components/map/ClusterMarker.tsx`
- Create: `__tests__/components/map/ClusterMarker.test.tsx`

- [ ] **Step 4.1: Write failing tests**

Create `__tests__/components/map/ClusterMarker.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { ClusterMarkerView } from '@/components/map/ClusterMarker'

describe('ClusterMarkerView', () => {
  it('renders the count', () => {
    const { getByText } = render(<ClusterMarkerView count={5} />)
    expect(getByText('5')).toBeTruthy()
  })

  it('renders large counts with + suffix', () => {
    const { getByText } = render(<ClusterMarkerView count={150} />)
    expect(getByText('99+')).toBeTruthy()
  })

  it('renders medium count unchanged', () => {
    const { getByText } = render(<ClusterMarkerView count={42} />)
    expect(getByText('42')).toBeTruthy()
  })
})
```

- [ ] **Step 4.2: Run to verify failure**

```bash
npm test -- ClusterMarker
```

Expected: FAIL.

- [ ] **Step 4.3: Implement ClusterMarker**

Create `components/map/ClusterMarker.tsx`:

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface ClusterMarkerViewProps {
  count: number
}

/** Bubble marker showing the number of embers in a cluster. */
export function ClusterMarkerView({ count }: ClusterMarkerViewProps) {
  const label = count > 99 ? '99+' : String(count)
  const size = count < 10 ? 36 : count < 50 ? 46 : 58

  return (
    <View
      testID="cluster-marker"
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: 'rgba(249, 115, 22, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
})
```

- [ ] **Step 4.4: Run tests**

```bash
npm test -- ClusterMarker
```

Expected: PASS — 3 tests.

- [ ] **Step 4.5: Commit**

```bash
git add components/map/ClusterMarker.tsx __tests__/components/map/ClusterMarker.test.tsx
git commit -m "feat: add ClusterMarker bubble component"
```

---

## Task 5: EmberTypeBadge component

**Files:**
- Create: `components/ember/EmberTypeBadge.tsx`
- Create: `__tests__/components/ember/EmberTypeBadge.test.tsx`

- [ ] **Step 5.1: Write failing tests**

Create `__tests__/components/ember/EmberTypeBadge.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { EmberTypeBadge } from '@/components/ember/EmberTypeBadge'

describe('EmberTypeBadge', () => {
  it('renders the emoji and label for a known type', () => {
    const { getByText } = render(<EmberTypeBadge type="hope" />)
    expect(getByText('✨')).toBeTruthy()
    expect(getByText('Hope')).toBeTruthy()
  })

  it('renders for another known type', () => {
    const { getByText } = render(<EmberTypeBadge type="vents" />)
    expect(getByText('🔥')).toBeTruthy()
    expect(getByText('Vents')).toBeTruthy()
  })

  it('renders a fallback for unknown or null type', () => {
    const { getByTestId } = render(<EmberTypeBadge type={null} />)
    expect(getByTestId('ember-type-badge')).toBeTruthy()
  })
})
```

- [ ] **Step 5.2: Run to verify failure**

```bash
npm test -- EmberTypeBadge
```

Expected: FAIL.

- [ ] **Step 5.3: Implement EmberTypeBadge**

Create `components/ember/EmberTypeBadge.tsx`:

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { EMBER_TYPES, EMBER_TYPE_INFO, type EmberType } from '@/constants/emberTypes'

interface EmberTypeBadgeProps {
  type: string | null
}

/** Pill badge showing the ember type emoji and label. Used in detail sheets. */
export function EmberTypeBadge({ type }: EmberTypeBadgeProps) {
  const isValid = type !== null && (EMBER_TYPES as readonly string[]).includes(type)
  const info = isValid ? EMBER_TYPE_INFO[type as EmberType] : null

  return (
    <View testID="ember-type-badge" style={styles.badge}>
      {info && <Text style={styles.emoji}>{info.emoji}</Text>}
      <Text style={styles.label}>{info ? info.label : 'Unknown'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  emoji: { fontSize: 14 },
  label: { fontSize: 13, color: '#a0aec0', fontWeight: '600' },
})
```

- [ ] **Step 5.4: Run tests**

```bash
npm test -- EmberTypeBadge
```

Expected: PASS — 3 tests.

- [ ] **Step 5.5: Commit**

```bash
git add components/ember/EmberTypeBadge.tsx __tests__/components/ember/EmberTypeBadge.test.tsx
git commit -m "feat: add EmberTypeBadge component"
```

---

## Task 6: Map screen — MapView, markers, and clustering

**Files:**
- Modify: `app/(tabs)/map.tsx`

> **Note:** react-native-maps `<MapView>` and `<Marker>` cannot render in Jest. Wrap map-specific imports in the screen file; do not write Jest tests for the map screen itself. Test the individual components (EmberMarker, BlueEmberMarker, ClusterMarker) separately — those are already done.

> **Supercluster note:** `react-native-map-clustering` v4.0.0 is installed but we're using `supercluster` directly per the spec's fallback recommendation. This gives us full control over cluster rendering and avoids potential incompatibilities.

- [ ] **Step 6.1: Implement the map screen**

Replace `app/(tabs)/map.tsx` with:

```tsx
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text } from 'react-native'
import MapView, { Marker, type Region } from 'react-native-maps'
import Supercluster from 'supercluster'
import { useMapStore } from '@/store/mapStore'
import { useMapEmbers, type MapEmber, type MapBlueEmber } from '@/hooks/useMapEmbers'
import { EmberMarkerView } from '@/components/map/EmberMarker'
import { BlueEmberMarkerView } from '@/components/map/BlueEmberMarker'
import { ClusterMarkerView } from '@/components/map/ClusterMarker'
import { EmberDetailSheet } from '@/components/ember/EmberDetailSheet'
import { BlueEmberDetailSheet } from '@/components/ember/BlueEmberDetailSheet'
import { LocationSearch } from '@/components/map/LocationSearch'

type GeoFeature = {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: { id: string; kind: 'orange' | 'blue' }
}

function regionToZoom(region: Region): number {
  return Math.round(Math.log(360 / region.longitudeDelta) / Math.log(2))
}

function regionToBounds(region: Region): [number, number, number, number] {
  return [
    region.longitude - region.longitudeDelta / 2,
    region.latitude - region.latitudeDelta / 2,
    region.longitude + region.longitudeDelta / 2,
    region.latitude + region.latitudeDelta / 2,
  ]
}

export default function MapScreen() {
  const { region, setRegion, selectedEmberId, selectedEmberType, setSelectedEmber } = useMapStore()
  const [queryRegion, setQueryRegion] = useState(region)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  const { embers, blueEmbers, isLoading } = useMapEmbers(queryRegion)

  // Build GeoJSON feature list for supercluster
  const features = useMemo<GeoFeature[]>(() => [
    ...embers.map((e) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [e.lng, e.lat] as [number, number] },
      properties: { id: e.id, kind: 'orange' as const },
    })),
    ...blueEmbers.map((b) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] as [number, number] },
      properties: { id: b.id, kind: 'blue' as const },
    })),
  ], [embers, blueEmbers])

  // Supercluster instance — stable ref, reloaded when features change
  const sc = useRef(new Supercluster<{ id: string; kind: 'orange' | 'blue' }>({ radius: 40, maxZoom: 16 }))
  useEffect(() => { sc.current.load(features) }, [features])

  // Clusters for current viewport
  const clusters = useMemo(() => {
    try {
      return sc.current.getClusters(regionToBounds(region), regionToZoom(region))
    } catch {
      return []
    }
  }, [region, features])

  // Build lookup maps for quick detail access
  const embersById = useMemo(() => new Map(embers.map((e) => [e.id, e])), [embers])
  const blueEmbersById = useMemo(() => new Map(blueEmbers.map((b) => [b.id, b])), [blueEmbers])

  const selectedEmber = selectedEmberId && selectedEmberType === 'orange'
    ? embersById.get(selectedEmberId) ?? null
    : null
  const selectedBlueEmber = selectedEmberId && selectedEmberType === 'blue'
    ? blueEmbersById.get(selectedEmberId) ?? null
    : null

  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setQueryRegion(newRegion), 500)
  }, [setRegion])

  function handleDismiss() {
    setSelectedEmber(null, null)
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates
          const { cluster: isCluster, point_count, id: clusterId, kind } = cluster.properties as any

          if (isCluster) {
            return (
              <Marker
                key={`cluster-${clusterId}`}
                coordinate={{ latitude: lat, longitude: lng }}
                tracksViewChanges={false}
              >
                <ClusterMarkerView count={point_count} />
              </Marker>
            )
          }

          const emberId = cluster.properties.id as string
          const emberKind = cluster.properties.kind as 'orange' | 'blue'
          const isSelected = selectedEmberId === emberId

          return (
            <Marker
              key={emberId}
              coordinate={{ latitude: lat, longitude: lng }}
              tracksViewChanges={isSelected}
              onPress={() => setSelectedEmber(emberId, emberKind)}
            >
              {emberKind === 'orange'
                ? <EmberMarkerView selected={isSelected} />
                : <BlueEmberMarkerView selected={isSelected} />
              }
            </Marker>
          )
        })}
      </MapView>

      <LocationSearch onSelect={(newRegion) => { setRegion(newRegion); setQueryRegion(newRegion) }} />

      {isLoading && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color="#e94560" />
        </View>
      )}

      {selectedEmber && (
        <EmberDetailSheet ember={selectedEmber} onDismiss={handleDismiss} />
      )}
      {selectedBlueEmber && (
        <BlueEmberDetailSheet blueEmber={selectedBlueEmber} onDismiss={handleDismiss} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loadingBadge: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#0f1117',
    borderRadius: 20,
    padding: 8,
  },
})
```

> **Note:** `tracksViewChanges={false}` on non-selected markers is a critical performance optimization. Custom marker views in react-native-maps re-render on every frame if `tracksViewChanges` is true (default). Only selected markers need re-rendering.

- [ ] **Step 6.2: Run existing tests to verify nothing broke**

```bash
npm test
```

Expected: All existing 22 tests pass (map screen is not tested by Jest — it imports react-native-maps).

- [ ] **Step 6.3: Commit**

```bash
git add app/(tabs)/map.tsx
git commit -m "feat: implement map screen with supercluster marker clustering"
```

---

## Task 7: LocationSearch component

**Files:**
- Create: `components/map/LocationSearch.tsx`
- Create: `__tests__/components/map/LocationSearch.test.tsx`

Uses the Nominatim OpenStreetMap geocoding API — no API key required, same provider as the web app.

- [ ] **Step 7.1: Write failing tests**

Create `__tests__/components/map/LocationSearch.test.tsx`:

```tsx
import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { LocationSearch } from '@/components/map/LocationSearch'

// Mock fetch
global.fetch = jest.fn()

describe('LocationSearch', () => {
  const mockOnSelect = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it('renders search input', () => {
    const { getByPlaceholderText } = render(<LocationSearch onSelect={mockOnSelect} />)
    expect(getByPlaceholderText('Search location...')).toBeTruthy()
  })

  it('calls Nominatim API when text is entered', async () => {
    const mockResults = [
      { place_id: 1, display_name: 'Manila, Philippines', lat: '14.5995', lon: '120.9842' },
    ]
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    })

    const { getByPlaceholderText } = render(<LocationSearch onSelect={mockOnSelect} />)
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Search location...'), 'Manila')
      // Advance past the debounce
      await new Promise((r) => setTimeout(r, 600))
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org'),
      expect.any(Object)
    )
  })

  it('calls onSelect with region when result is tapped', async () => {
    const mockResults = [
      { place_id: 1, display_name: 'Manila, Philippines', lat: '14.5995', lon: '120.9842' },
    ]
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    })

    const { getByPlaceholderText, findByText } = render(<LocationSearch onSelect={mockOnSelect} />)
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Search location...'), 'Manila')
      await new Promise((r) => setTimeout(r, 600))
    })

    const result = await findByText('Manila, Philippines')
    fireEvent.press(result)
    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 14.5995, longitude: 120.9842 })
    )
  })
})
```

- [ ] **Step 7.2: Run to verify failure**

```bash
npm test -- LocationSearch
```

Expected: FAIL.

- [ ] **Step 7.3: Implement LocationSearch**

Create `components/map/LocationSearch.tsx`:

```tsx
import React, { useState, useRef, useCallback } from 'react'
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'

interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface LocationSearchProps {
  onSelect: (region: Region) => void
}

/** Nominatim geocoding search bar. Floats over the map in the top-left corner. */
export function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(async (text: string) => {
    if (text.trim().length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5`,
        { headers: { 'User-Agent': 'Embers Mobile App (embersthoughts.com)' } }
      )
      if (res.ok) {
        setResults(await res.json())
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(text: string) {
    setQuery(text)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => search(text), 500)
  }

  function handleSelect(item: NominatimResult) {
    setQuery(item.display_name)
    setResults([])
    onSelect({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Search location..."
          placeholderTextColor="#4a5568"
          value={query}
          onChangeText={handleChange}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading && <ActivityIndicator size="small" color="#e94560" style={styles.spinner} />}
      </View>
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.place_id)}
          style={styles.results}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
              <Text style={styles.resultText} numberOfLines={2}>{item.display_name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1117',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d3748',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 44,
    color: '#f7fafc',
    fontSize: 15,
  },
  spinner: { marginLeft: 8 },
  results: {
    backgroundColor: '#0f1117',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginTop: 4,
    maxHeight: 200,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  resultText: { color: '#e2e8f0', fontSize: 14 },
})
```

- [ ] **Step 7.4: Run tests**

```bash
npm test -- LocationSearch
```

Expected: PASS — 3 tests.

- [ ] **Step 7.5: Commit**

```bash
git add components/map/LocationSearch.tsx __tests__/components/map/LocationSearch.test.tsx
git commit -m "feat: add LocationSearch component with Nominatim geocoding"
```

---

## Task 8: Shared ember utilities

**Files:**
- Create: `lib/emberUtils.ts`

A small utility module with shared helpers used by both detail sheets.

- [ ] **Step 8.1: Create lib/emberUtils.ts**

```ts
/** Returns the number of days remaining before an ember fades.
 *  @param createdAt  ISO timestamp string
 *  @param relitAt    ISO timestamp string or null
 *  @param expiryDays Days until expiry from the last active date (30 for orange, 7 for blue)
 */
export function daysRemaining(
  createdAt: string,
  relitAt: string | null,
  expiryDays: number
): number {
  const lastActive = relitAt
    ? Math.max(new Date(createdAt).getTime(), new Date(relitAt).getTime())
    : new Date(createdAt).getTime()
  const msRemaining = lastActive + expiryDays * 24 * 60 * 60 * 1000 - Date.now()
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)))
}
```

> No Jest test needed — this is a pure function with trivial logic. The detail sheets that consume it are tested via manual smoke tests.

- [ ] **Step 8.2: Commit**

```bash
git add lib/emberUtils.ts
git commit -m "feat: add daysRemaining utility for ember expiry display"
```

---

## Task 9: EmberDetailSheet (orange embers)

**Files:**
- Create: `components/ember/EmberDetailSheet.tsx`

No Jest test for this component — it is a Modal that uses react-native-maps-dependent data and ScrollView patterns that require a device/simulator for meaningful verification. Manual testing in Step 9.3.

The detail sheet shows: ember thought text, type badge, author username, relight count, days until fade, and photos (horizontal scroll if present). Reactions, comments, and relights are **not** implemented here — those come in Phase 4.

- [ ] **Step 9.1: Implement EmberDetailSheet**

Create `components/ember/EmberDetailSheet.tsx`:

```tsx
import React from 'react'
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native'
import { EmberTypeBadge } from './EmberTypeBadge'
import { daysRemaining } from '@/lib/emberUtils'
import type { MapEmber } from '@/hooks/useMapEmbers'

const SCREEN_WIDTH = Dimensions.get('window').width

interface EmberDetailSheetProps {
  ember: MapEmber
  onDismiss: () => void
}

export function EmberDetailSheet({ ember, onDismiss }: EmberDetailSheetProps) {
  const days = daysRemaining(ember.created_at, ember.relit_at, 30)
  const photos = ember.photo_urls ?? []

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />
      <SafeAreaView style={styles.sheetWrapper}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header row */}
          <View style={styles.header}>
            <EmberTypeBadge type={ember.ember_type} />
            <TouchableOpacity onPress={onDismiss}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Photos */}
            {photos.length > 0 && (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {photos.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.photo} resizeMode="cover" />
                ))}
              </ScrollView>
            )}

            {/* Thought text */}
            <Text style={styles.thought}>{ember.thought}</Text>

            {/* Meta row */}
            <View style={styles.meta}>
              <Text style={styles.metaText}>
                @{ember.username ?? 'unknown'}
              </Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>
                🔁 {ember.relight_count} relights
              </Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={[styles.metaText, days <= 3 && styles.urgentText]}>
                {days === 0 ? 'Fading today' : `${days}d left`}
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#0f1117',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2d3748',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: { fontSize: 18, color: '#4a5568', paddingLeft: 16 },
  photoScroll: { marginBottom: 16, marginHorizontal: -20 },
  photo: { width: SCREEN_WIDTH, height: 200 },
  thought: {
    fontSize: 17,
    color: '#f7fafc',
    lineHeight: 26,
    marginBottom: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 8,
  },
  metaText: { fontSize: 13, color: '#718096' },
  metaDot: { fontSize: 13, color: '#2d3748' },
  urgentText: { color: '#e94560' },
})
```

- [ ] **Step 9.2: Run all tests to verify nothing broke**

```bash
npm test
```

Expected: All previously passing tests still pass.

- [ ] **Step 9.3: Manual smoke test**

Start the dev server and open in simulator:

```bash
npx expo start
```

- Tap any orange ember marker → EmberDetailSheet opens from bottom
- Ember thought text is readable
- Type badge shows correct emoji and label
- Tap backdrop or ✕ → sheet dismisses
- Meta row shows username, relight count, days remaining

- [ ] **Step 9.4: Commit**

```bash
git add components/ember/EmberDetailSheet.tsx
git commit -m "feat: add EmberDetailSheet for orange ember tap-to-view"
```

---

## Task 10: AudioPlayer component

**Files:**
- Create: `components/audio/AudioPlayer.tsx`
- Create: `__tests__/components/audio/AudioPlayer.test.tsx`

Uses `expo-av` `Audio.Sound` for playback. The player shows play/pause, elapsed time, and total duration.

- [ ] **Step 10.1: Write failing tests**

Create `__tests__/components/audio/AudioPlayer.test.tsx`:

```tsx
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { AudioPlayer } from '@/components/audio/AudioPlayer'

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          setOnPlaybackStatusUpdate: jest.fn(),
          playAsync: jest.fn().mockResolvedValue(undefined),
          pauseAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
        status: { isLoaded: true, durationMillis: 15000 },
      }),
    },
  },
}))

describe('AudioPlayer', () => {
  it('renders play button initially', () => {
    const { getByTestId } = render(
      <AudioPlayer uri="https://example.com/audio.m4a" duration={15} />
    )
    expect(getByTestId('audio-play-btn')).toBeTruthy()
  })

  it('shows duration text', () => {
    const { getByText } = render(
      <AudioPlayer uri="https://example.com/audio.m4a" duration={15} />
    )
    expect(getByText('0:15')).toBeTruthy()
  })

  it('calls Audio.Sound.createAsync when play is pressed', async () => {
    const { Audio } = require('expo-av')
    const { getByTestId } = render(
      <AudioPlayer uri="https://example.com/audio.m4a" duration={15} />
    )
    fireEvent.press(getByTestId('audio-play-btn'))
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        { uri: 'https://example.com/audio.m4a' },
        { shouldPlay: true }
      )
    })
  })
})
```

- [ ] **Step 10.2: Run to verify failure**

```bash
npm test -- AudioPlayer
```

Expected: FAIL.

- [ ] **Step 10.3: Implement AudioPlayer**

Create `components/audio/AudioPlayer.tsx`:

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Audio, type AVPlaybackStatus } from 'expo-av'

interface AudioPlayerProps {
  uri: string
  duration: number | null  // seconds
}

function formatSeconds(s: number): string {
  const mins = Math.floor(s / 60)
  const secs = Math.floor(s % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Audio player for blue ember playback using expo-av. */
export function AudioPlayer({ uri, duration }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Configure audio session once on mount
  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false })
    return () => {
      soundRef.current?.unloadAsync()
    }
  }, [])

  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return
    setElapsed(Math.floor((status.positionMillis ?? 0) / 1000))
    if (status.didJustFinish) {
      setPlaying(false)
      setElapsed(0)
    }
  }, [])

  async function handlePlayPause() {
    if (playing) {
      await soundRef.current?.pauseAsync()
      setPlaying(false)
      return
    }

    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      )
      sound.setOnPlaybackStatusUpdate(onPlaybackStatus)
      soundRef.current = sound
    } else {
      await soundRef.current.playAsync()
    }
    setPlaying(true)
  }

  const totalSeconds = duration ?? 0

  return (
    <View style={styles.container}>
      <TouchableOpacity testID="audio-play-btn" onPress={handlePlayPause} style={styles.playBtn}>
        <Text style={styles.playIcon}>{playing ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: totalSeconds > 0 ? `${(elapsed / totalSeconds) * 100}%` : '0%' },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatSeconds(elapsed)}</Text>
          <Text style={styles.timeText}>{formatSeconds(totalSeconds)}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#60a5fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 20, color: '#fff' },
  progressContainer: { flex: 1 },
  progressTrack: {
    height: 4,
    backgroundColor: '#2d3748',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#60a5fa', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontSize: 11, color: '#718096' },
})
```

- [ ] **Step 10.4: Run tests**

```bash
npm test -- AudioPlayer
```

Expected: PASS — 3 tests.

- [ ] **Step 10.5: Commit**

```bash
git add components/audio/AudioPlayer.tsx __tests__/components/audio/AudioPlayer.test.tsx
git commit -m "feat: add AudioPlayer component with expo-av playback"
```

---

## Task 11: BlueEmberDetailSheet

**Files:**
- Create: `components/ember/BlueEmberDetailSheet.tsx`

No Jest test — same rationale as EmberDetailSheet (Modal + react-native-maps-dependent data). Verify manually.

- [ ] **Step 11.1: Implement BlueEmberDetailSheet**

Create `components/ember/BlueEmberDetailSheet.tsx`:

```tsx
import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native'
import { AudioPlayer } from '@/components/audio/AudioPlayer'
import { daysRemaining } from '@/lib/emberUtils'
import type { MapBlueEmber } from '@/hooks/useMapEmbers'

interface BlueEmberDetailSheetProps {
  blueEmber: MapBlueEmber
  onDismiss: () => void
}

export function BlueEmberDetailSheet({ blueEmber, onDismiss }: BlueEmberDetailSheetProps) {
  const days = daysRemaining(blueEmber.created_at, blueEmber.relit_at, 7)

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />
      <SafeAreaView style={styles.sheetWrapper}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeEmoji}>🎙️</Text>
              <Text style={styles.typeLabel}>Audio Ember</Text>
            </View>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          {blueEmber.title ? (
            <Text style={styles.title}>{blueEmber.title}</Text>
          ) : null}

          {/* Audio player */}
          <AudioPlayer uri={blueEmber.audio_url} duration={blueEmber.audio_duration} />

          {/* Meta */}
          <View style={styles.meta}>
            <Text style={styles.metaText}>@{blueEmber.username ?? 'unknown'}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>🔁 {blueEmber.relight_count} relights</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={[styles.metaText, days <= 2 && styles.urgentText]}>
              {days === 0 ? 'Fading today' : `${days}d left`}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#0f1117',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2d3748',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  typeEmoji: { fontSize: 14 },
  typeLabel: { fontSize: 13, color: '#60a5fa', fontWeight: '600' },
  closeBtn: { fontSize: 18, color: '#4a5568', paddingLeft: 16 },
  title: {
    fontSize: 17,
    color: '#f7fafc',
    fontWeight: '600',
    marginBottom: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 16,
  },
  metaText: { fontSize: 13, color: '#718096' },
  metaDot: { fontSize: 13, color: '#2d3748' },
  urgentText: { color: '#60a5fa' },
})
```

- [ ] **Step 11.2: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 11.3: Manual smoke test**

```bash
npx expo start
```

- Tap a blue ember marker (blue dot) → BlueEmberDetailSheet opens
- Title is displayed
- Audio player renders with play button and duration
- Pressing play starts audio (requires real device or simulator with audio)
- Tap backdrop → sheet dismisses

- [ ] **Step 11.4: Commit**

```bash
git add components/ember/BlueEmberDetailSheet.tsx
git commit -m "feat: add BlueEmberDetailSheet with audio playback"
```

---

## Task 12: Realtime subscription for map viewport

**Files:**
- Modify: `app/(tabs)/map.tsx`

Adds a Supabase realtime subscription that listens for new embers (INSERT) and deleted embers (DELETE) within the visible viewport. When changes occur, it invalidates the React Query cache so the map updates automatically.

- [ ] **Step 12.1: Add realtime subscription to map screen**

Open `app/(tabs)/map.tsx`. Add the following import at the top:

```tsx
import { useQueryClient } from '@tanstack/react-query'
```

Inside `MapScreen`, after the existing hooks:

```tsx
const queryClient = useQueryClient()

// Realtime subscription: invalidate map query when embers or blue_embers change in viewport
useEffect(() => {
  function isInViewport(lat: number, lng: number) {
    const south = queryRegion.latitude - queryRegion.latitudeDelta / 2
    const north = queryRegion.latitude + queryRegion.latitudeDelta / 2
    const west = queryRegion.longitude - queryRegion.longitudeDelta / 2
    const east = queryRegion.longitude + queryRegion.longitudeDelta / 2
    return lat >= south && lat <= north && lng >= west && lng <= east
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['mapEmbers'] })
  }

  const channel = supabase
    .channel('map-embers-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'embers' }, (payload) => {
      const { lat, lng } = payload.new as { lat: number; lng: number }
      if (isInViewport(lat, lng)) invalidate()
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'embers' }, invalidate)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blue_embers' }, (payload) => {
      const { lat, lng } = payload.new as { lat: number; lng: number }
      if (isInViewport(lat, lng)) invalidate()
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'blue_embers' }, invalidate)
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [queryRegion, queryClient])
```

Also add the missing supabase import at the top of the file:

```tsx
import { supabase } from '@/lib/supabase/client'
```

- [ ] **Step 12.2: Run all tests**

```bash
npm test
```

Expected: All tests still pass.

- [ ] **Step 12.3: Commit**

```bash
git add app/(tabs)/map.tsx
git commit -m "feat: add realtime subscription for viewport ember and blue_ember updates"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
npm test
```

Expected: All tests pass (count ≥ 35 — 22 from Phase 1 + new Phase 2 tests).

- [ ] **Run tsc**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Manual end-to-end test on simulator**

```bash
npx expo start
```

Test flow:
1. App opens → auth gate → log in → Map tab
2. Map renders with `react-native-maps` (no crash)
3. Orange ember markers appear as orange dots
4. Blue ember markers appear as blue dots
5. Zoom out → markers cluster into count bubbles
6. Zoom in → markers separate
7. Tap orange marker → EmberDetailSheet slides up, shows thought text and type badge
8. Tap blue marker → BlueEmberDetailSheet slides up, press play to hear audio
9. Search for "Manila" in the location search → map animates to Manila
10. Pan map → embers refresh after ~500ms debounce

---

## Phase 3 Preview

Phase 3 will add Ember Creation: text/audio post flow, photo picker, image crop, and location confirmation. It builds on top of the map (posting from the current map center) and the audio infrastructure (AudioPlayer becomes AudioRecorder).
