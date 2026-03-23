# Embers Mobile — WebView Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `react-native-maps` (requires paid Google Maps key on Android) with a `react-native-webview` rendering Leaflet + OpenStreetMap tiles — completely free, no API key required.

**Architecture:** A full-screen `WebView` renders Leaflet with OSM tiles and Leaflet.markercluster for clustering. All other Phase 2 components (data fetching, stores, detail sheets, audio, search) are unchanged. A two-way `postMessage` bridge connects React Native to Leaflet: RN sends ember data and jump commands; Leaflet sends marker taps and viewport changes back.

**Tech Stack:** react-native-webview, Leaflet 1.9.4 (CDN), Leaflet.markercluster 1.5.3 (CDN), expo-location (already installed), @tanstack/react-query v5, Zustand

---

> **This replaces Phase 2's map renderer.** The plan is a targeted surgical replacement — only 4 tasks, mostly in `map.tsx` and one new file. Everything else from Phase 2 is untouched.

---

## File Map

**Created:**
```
lib/leafletMap.ts              # buildMapHtml(lat, lng, zoom): string — Leaflet HTML string
__tests__/lib/leafletMap.test.ts  # Unit tests for buildMapHtml()
```

**Modified:**
```
store/mapStore.ts              # Replace 'react-native-maps' Region import with local interface
app/(tabs)/map.tsx             # Replace MapView/Marker/Supercluster with WebView + bridge
```

**Deleted:**
```
app.config.ts                  # No longer needed (Google Maps key injection removed)
components/map/EmberMarker.tsx
components/map/BlueEmberMarker.tsx
components/map/ClusterMarker.tsx
__tests__/components/map/EmberMarker.test.tsx
__tests__/components/map/BlueEmberMarker.test.tsx
__tests__/components/map/ClusterMarker.test.tsx
```

**Packages:**
- Install: `react-native-webview`
- Uninstall: `react-native-maps`, `react-native-map-clustering`, `supercluster`, `@types/supercluster`

---

## Task 1: Package cleanup and file deletion

**Files:**
- Delete: `app.config.ts`
- Delete: `components/map/EmberMarker.tsx`, `BlueEmberMarker.tsx`, `ClusterMarker.tsx`
- Delete: `__tests__/components/map/EmberMarker.test.tsx`, `BlueEmberMarker.test.tsx`, `ClusterMarker.test.tsx`

No TDD here — this task is pure removal.

- [ ] **Step 1.1: Install react-native-webview**

```bash
cd D:/Projects/embers-mobile
npx expo install react-native-webview
```

Expected: package added to `node_modules` and `package.json`.

- [ ] **Step 1.2: Uninstall react-native-maps and clustering packages**

```bash
cd D:/Projects/embers-mobile
npm uninstall react-native-maps react-native-map-clustering supercluster @types/supercluster
```

- [ ] **Step 1.3: Delete app.config.ts**

```bash
cd D:/Projects/embers-mobile
rm app.config.ts
```

- [ ] **Step 1.4: Delete unused marker components and their tests**

```bash
cd D:/Projects/embers-mobile
rm components/map/EmberMarker.tsx
rm components/map/BlueEmberMarker.tsx
rm components/map/ClusterMarker.tsx
rm __tests__/components/map/EmberMarker.test.tsx
rm __tests__/components/map/BlueEmberMarker.test.tsx
rm __tests__/components/map/ClusterMarker.test.tsx
```

- [ ] **Step 1.5: Run tests to verify the remaining suite still passes**

```bash
cd D:/Projects/embers-mobile && npm test
```

Expected: Tests pass. The deleted test files are gone, so Jest no longer runs them. The remaining 39 tests (45 minus the 6 deleted) should all pass.

> **Note:** `app/(tabs)/map.tsx` still imports `react-native-maps` at this point. Jest will not fail because `map.tsx` is not tested by Jest (it imports react-native-maps which is mocked). TypeScript will fail if you run `tsc`, but `npm test` runs Jest only. Fix the imports in Task 4.

- [ ] **Step 1.6: Commit**

```bash
cd D:/Projects/embers-mobile
git add -A
git commit -m "chore: remove react-native-maps, install react-native-webview, delete unused marker components"
```

---

## Task 2: Fix mapStore Region import

**Files:**
- Modify: `store/mapStore.ts`

`mapStore.ts` currently imports `type { Region } from 'react-native-maps'` which is now uninstalled. Replace it with a local interface.

- [ ] **Step 2.1: Run mapStore tests to verify they still pass before touching the file**

```bash
cd D:/Projects/embers-mobile && npm test -- mapStore
```

Expected: 7 tests pass (they don't import react-native-maps directly).

- [ ] **Step 2.2: Replace the react-native-maps import in mapStore.ts**

Open `store/mapStore.ts`. Replace line 2:

```ts
import type { Region } from 'react-native-maps'
```

With a local interface definition (add before `const DEFAULT_REGION`):

```ts
export interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}
```

The full updated file should look like:

```ts
import { create } from 'zustand'

export interface Region {
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
  setSelectedEmberId: (id: string | null) => void
  setSelectedEmber: (id: string | null, type: 'orange' | 'blue' | null) => void
}

export const useMapStore = create<MapState>((set) => ({
  region: DEFAULT_REGION,
  selectedEmberId: null,
  selectedEmberType: null,
  setRegion: (region) => set({ region }),
  setSelectedEmberId: (selectedEmberId) => set({ selectedEmberId }),
  setSelectedEmber: (id, type) => set({ selectedEmberId: id, selectedEmberType: type }),
}))
```

> **Why `export interface Region`:** `hooks/useMapEmbers.ts` and `components/map/LocationSearch.tsx` each define their own local `Region` interfaces with the same shape. This export lets `map.tsx` import `Region` from `mapStore` instead of re-defining it. The existing hooks don't need to change — their local definitions are identical and TypeScript will structurally match them.

- [ ] **Step 2.3: Run mapStore tests again**

```bash
cd D:/Projects/embers-mobile && npm test -- mapStore
```

Expected: All 7 tests still pass.

- [ ] **Step 2.4: Run full suite**

```bash
cd D:/Projects/embers-mobile && npm test
```

Expected: 39 tests pass.

- [ ] **Step 2.5: Commit**

```bash
cd D:/Projects/embers-mobile
git add store/mapStore.ts
git commit -m "fix: replace react-native-maps Region import with local interface in mapStore"
```

---

## Task 3: Create lib/leafletMap.ts

**Files:**
- Create: `lib/leafletMap.ts`
- Create: `__tests__/lib/leafletMap.test.ts`

`buildMapHtml(lat, lng, zoom)` returns the complete Leaflet HTML string. The HTML is self-contained: CDN deps, map init, marker rendering, and the full two-way message bridge.

- [ ] **Step 3.1: Write failing tests**

Create `__tests__/lib/leafletMap.test.ts`:

```ts
import { buildMapHtml } from '@/lib/leafletMap'

describe('buildMapHtml', () => {
  let html: string

  beforeAll(() => {
    html = buildMapHtml(14.5995, 120.9842, 11)
  })

  it('returns a string', () => {
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(100)
  })

  it('includes Leaflet from CDN', () => {
    expect(html).toContain('leaflet')
    expect(html).toContain('unpkg.com')
  })

  it('includes markercluster', () => {
    expect(html).toContain('markercluster')
  })

  it('sends MAP_READY on load', () => {
    expect(html).toContain('MAP_READY')
  })

  it('handles UPDATE_EMBERS message', () => {
    expect(html).toContain('UPDATE_EMBERS')
  })

  it('sends MARKER_TAP on marker click', () => {
    expect(html).toContain('MARKER_TAP')
  })

  it('sends REGION_CHANGE on map moveend', () => {
    expect(html).toContain('REGION_CHANGE')
  })

  it('handles JUMP_TO message', () => {
    expect(html).toContain('JUMP_TO')
  })

  it('bakes in the provided lat/lng/zoom', () => {
    expect(html).toContain('14.5995')
    expect(html).toContain('120.9842')
    expect(html).toContain('11')
  })
})
```

- [ ] **Step 3.2: Run to verify failure**

```bash
cd D:/Projects/embers-mobile && npm test -- leafletMap
```

Expected: FAIL — `buildMapHtml` not found.

- [ ] **Step 3.3: Implement lib/leafletMap.ts**

Create `lib/leafletMap.ts`:

```ts
/**
 * Builds a self-contained Leaflet HTML string for use in a react-native-webview.
 * @param lat  Initial center latitude
 * @param lng  Initial center longitude
 * @param zoom Initial zoom level
 */
export function buildMapHtml(lat: number, lng: number, zoom: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100vw; height: 100vh; background: #0f1117; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${zoom});

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  var markers = L.markerClusterGroup({ maxClusterRadius: 40 });
  map.addLayer(markers);

  // Marker icon factories
  function orangeIcon(selected) {
    var size = selected ? 20 : 14;
    var color = '#f97316';
    var bg = selected ? 'rgba(249,115,22,0.3)' : color;
    return L.divIcon({
      className: '',
      html: '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + bg + ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;">'
        + (selected ? '<div style="width:12px;height:12px;border-radius:50%;background:' + color + ';border:2px solid #fff;"></div>' : '')
        + '</div>',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function blueIcon(selected) {
    var size = selected ? 20 : 14;
    var color = '#60a5fa';
    var bg = selected ? 'rgba(96,165,250,0.3)' : color;
    return L.divIcon({
      className: '',
      html: '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + bg + ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;">'
        + (selected ? '<div style="width:12px;height:12px;border-radius:50%;background:' + color + ';border:2px solid #fff;"></div>' : '')
        + '</div>',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // Post a message back to React Native
  function postToRN(obj) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    }
  }

  // Current marker layer (rebuilt on UPDATE_EMBERS)
  var markerMap = {};

  function updateEmbers(embers, location) {
    markers.clearLayers();
    markerMap = {};

    embers.forEach(function(e) {
      var icon = e.kind === 'orange' ? orangeIcon(false) : blueIcon(false);
      var m = L.marker([e.lat, e.lng], { icon: icon });
      m.on('click', function() {
        postToRN({ type: 'MARKER_TAP', id: e.id, kind: e.kind });
      });
      markers.addLayer(m);
      markerMap[e.id] = { marker: m, kind: e.kind };
    });

    if (location) {
      map.setView([location.lat, location.lng], 13, { animate: true });
    }
  }

  // Handle messages from React Native
  function handleMessage(event) {
    try {
      var msg = JSON.parse(event.data);
      if (msg.type === 'UPDATE_EMBERS') {
        updateEmbers(msg.embers || [], msg.location || null);
      } else if (msg.type === 'JUMP_TO') {
        map.setView([msg.lat, msg.lng], msg.zoom || 13, { animate: true });
      }
    } catch (e) {}
  }

  window.addEventListener('message', handleMessage);
  document.addEventListener('message', handleMessage);

  // Send REGION_CHANGE when user finishes panning/zooming
  map.on('moveend', function() {
    var b = map.getBounds();
    postToRN({
      type: 'REGION_CHANGE',
      south: b.getSouth(),
      north: b.getNorth(),
      west: b.getWest(),
      east: b.getEast(),
      zoom: map.getZoom(),
    });
  });

  // Signal ready
  document.addEventListener('DOMContentLoaded', function() {
    postToRN({ type: 'MAP_READY' });
  });
  // Fallback if DOMContentLoaded already fired
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() { postToRN({ type: 'MAP_READY' }); }, 0);
  }
</script>
</body>
</html>`
}
```

- [ ] **Step 3.4: Run tests**

```bash
cd D:/Projects/embers-mobile && npm test -- leafletMap
```

Expected: PASS — 9 tests.

- [ ] **Step 3.5: Run full suite**

```bash
cd D:/Projects/embers-mobile && npm test
```

Expected: 48 tests pass (39 remaining from Task 1 + 9 new leafletMap tests).

- [ ] **Step 3.6: Commit**

```bash
cd D:/Projects/embers-mobile
git add lib/leafletMap.ts __tests__/lib/leafletMap.test.ts
git commit -m "feat: add buildMapHtml Leaflet HTML builder for WebView map"
```

---

## Task 4: Rewrite map screen with WebView

**Files:**
- Modify: `app/(tabs)/map.tsx`

Replace the entire `MapView` / `Marker` / `Supercluster` implementation with a `WebView` that renders the Leaflet HTML. Add the two-way message bridge and expo-location for initial pan.

> **No Jest test** — WebView cannot render in Jest, same as the previous MapView screen.

- [ ] **Step 4.1: Read the current map.tsx before editing**

Read `D:/Projects/embers-mobile/app/(tabs)/map.tsx` to understand what's being replaced.

- [ ] **Step 4.2: Replace map.tsx with the WebView implementation**

Replace the entire file content of `app/(tabs)/map.tsx` with:

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import * as Location from 'expo-location'
import { useQueryClient } from '@tanstack/react-query'
import { useMapStore, type Region } from '@/store/mapStore'
import { useMapEmbers, type MapEmber, type MapBlueEmber } from '@/hooks/useMapEmbers'
import { EmberDetailSheet } from '@/components/ember/EmberDetailSheet'
import { BlueEmberDetailSheet } from '@/components/ember/BlueEmberDetailSheet'
import { LocationSearch } from '@/components/map/LocationSearch'
import { supabase } from '@/lib/supabase/client'
import { buildMapHtml } from '@/lib/leafletMap'

const DEFAULT_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
}

// zoom 11 baked into the initial HTML — Philippines overview
const MAP_HTML = buildMapHtml(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude, 11)

export default function MapScreen() {
  const { region, setRegion, selectedEmberId, selectedEmberType, setSelectedEmber } = useMapStore()
  const [queryRegion, setQueryRegion] = useState(region)
  const [mapReady, setMapReady] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const webViewRef = useRef<WebView>(null)

  const { embers, blueEmbers, isLoading } = useMapEmbers(queryRegion)
  const queryClient = useQueryClient()

  // Request device location once on mount
  useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status !== 'granted') return
        return Location.getCurrentPositionAsync({})
      })
      .then((pos) => {
        if (pos) {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        }
      })
      .catch(() => {})
  }, [])

  // Send ember data to the WebView
  const sendEmbers = useCallback(() => {
    if (!webViewRef.current) return
    const markerData = [
      ...embers.map((e: MapEmber) => ({ id: e.id, lat: e.lat, lng: e.lng, kind: 'orange' as const })),
      ...blueEmbers.map((b: MapBlueEmber) => ({ id: b.id, lat: b.lat, lng: b.lng, kind: 'blue' as const })),
    ]
    webViewRef.current.postMessage(JSON.stringify({
      type: 'UPDATE_EMBERS',
      embers: markerData,
      location: userLocation,
    }))
  }, [embers, blueEmbers, userLocation])

  // Send embers whenever data or location changes (only after map is ready)
  useEffect(() => {
    if (mapReady) sendEmbers()
  }, [mapReady, sendEmbers])

  // Realtime subscription: invalidate when embers change in viewport
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

  // Handle messages from the WebView
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data)

      if (msg.type === 'MAP_READY') {
        setMapReady(true)
        // sendEmbers will fire via the useEffect above once mapReady flips to true
      } else if (msg.type === 'MARKER_TAP') {
        setSelectedEmber(msg.id as string, msg.kind as 'orange' | 'blue')
      } else if (msg.type === 'REGION_CHANGE') {
        const newRegion: Region = {
          latitude: (msg.north + msg.south) / 2,
          longitude: (msg.east + msg.west) / 2,
          latitudeDelta: msg.north - msg.south,
          longitudeDelta: msg.east - msg.west,
        }
        setRegion(newRegion)
        setQueryRegion(newRegion)
      }
    } catch {
      // ignore malformed messages
    }
  }, [setSelectedEmber, setRegion])

  function handleDismiss() {
    setSelectedEmber(null, null)
  }

  // Build lookup maps for detail sheets
  const embersById = new Map(embers.map((e) => [e.id, e]))
  const blueEmbersById = new Map(blueEmbers.map((b) => [b.id, b]))

  const selectedEmber = selectedEmberId && selectedEmberType === 'orange'
    ? embersById.get(selectedEmberId) ?? null
    : null
  const selectedBlueEmber = selectedEmberId && selectedEmberType === 'blue'
    ? blueEmbersById.get(selectedEmberId) ?? null
    : null

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: MAP_HTML }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        allowsInlineMediaPlayback
      />

      <LocationSearch
        onSelect={(newRegion) => {
          setRegion(newRegion)
          setQueryRegion(newRegion)
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'JUMP_TO',
            lat: newRegion.latitude,
            lng: newRegion.longitude,
            zoom: 13,
          }))
        }}
      />

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

- [ ] **Step 4.3: Run full test suite**

```bash
cd D:/Projects/embers-mobile && npm test
```

Expected: 48 tests pass. `map.tsx` is not tested by Jest — the test count stays the same as after Task 3.

If any tests fail due to the deleted marker component imports being referenced elsewhere, track down the imports and remove them.

- [ ] **Step 4.4: Commit**

```bash
cd D:/Projects/embers-mobile
git add app/(tabs)/map.tsx
git commit -m "feat: replace react-native-maps MapView with WebView Leaflet map"
```

---

## Final Verification

- [ ] **Run full test suite one last time**

```bash
cd D:/Projects/embers-mobile && npm test
```

Expected: 48 tests pass, 0 failures.

- [ ] **Manual smoke test**

```bash
cd D:/Projects/embers-mobile && npx expo start
```

Verify:
- Map renders with OSM tiles (no Google key needed)
- Markers appear as orange/blue dots
- Clusters appear as count bubbles when zoomed out
- Tap a marker → EmberDetailSheet or BlueEmberDetailSheet opens
- Dismiss sheet → sheet closes
- Search bar (LocationSearch) → typing a location and selecting it pans the map
- Map works on both iOS and Android without any API key
