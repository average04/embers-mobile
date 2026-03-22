import { useQuery } from '@tanstack/react-query'

interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

// Minimal types for map display — just what the marker needs
export type MapEmberMarker = { id: string; lat: number; lng: number }
export type MapBlueEmberMarker = { id: string; lat: number; lng: number }

// Full types for detail sheets — fetched from Supabase on tap
export type MapEmber = {
  id: string
  thought: string
  lat: number
  lng: number
  ember_type: string | null
  user_id: string | null
  username: string | null
  created_at: string
  relit_at: string | null
  relight_count: number
  photo_urls: string[] | null
}

export type MapBlueEmber = {
  id: string
  title: string
  audio_url: string
  audio_duration: number
  lat: number
  lng: number
  user_id: string | null
  username: string | null
  created_at: string
  relit_at: string | null
  relight_count: number
}

const ORANGE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000
const BLUE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL ?? ''

// Orange embers use Unix epoch seconds in compact format
function isActiveEpoch(catSec: number, ratSec: number | null, expiryMs: number): boolean {
  const lastActiveSec = ratSec != null ? Math.max(catSec, ratSec) : catSec
  return Date.now() - lastActiveSec * 1000 < expiryMs
}

// Blue embers use ISO strings
function isActiveIso(createdAt: string, relitAt: string | null | undefined, expiryMs: number): boolean {
  const lastActive = relitAt
    ? Math.max(new Date(createdAt).getTime(), new Date(relitAt).getTime())
    : new Date(createdAt).getTime()
  return Date.now() - lastActive < expiryMs
}

function inViewport(lat: number, lng: number, region: Region): boolean {
  const south = region.latitude - region.latitudeDelta / 2
  const north = region.latitude + region.latitudeDelta / 2
  const west = region.longitude - region.longitudeDelta / 2
  const east = region.longitude + region.longitudeDelta / 2
  return lat >= south && lat <= north && lng >= west && lng <= east
}

async function fetchAllEmbers() {
  const [orangeRes, blueRes] = await Promise.all([
    fetch(`${WEB_APP_URL}/api/embers`),
    fetch(`${WEB_APP_URL}/api/blue-embers`),
  ])
  const [orange, blue] = await Promise.all([orangeRes.json(), blueRes.json()])
  return { orange, blue }
}

export function useMapEmbers(region: Region) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mapEmbers'],
    queryFn: fetchAllEmbers,
    staleTime: 30_000,
    gcTime: 120_000,
  })

  const embers: MapEmberMarker[] = []
  const blueEmbers: MapBlueEmberMarker[] = []

  if (data) {
    const { orange, blue } = data

    // Parse compact columnar format: { ids, lats, lngs, cats (epoch s), rats (epoch s | null) }
    for (let i = 0; i < (orange.ids?.length ?? 0); i++) {
      const lat = orange.lats[i]
      const lng = orange.lngs[i]
      if (
        isActiveEpoch(orange.cats[i], orange.rats[i], ORANGE_EXPIRY_MS) &&
        inViewport(lat, lng, region)
      ) {
        embers.push({ id: orange.ids[i], lat, lng })
      }
    }

    // Parse blue embers array format: { id, position: [lat, lng], created_at, relit_at? }
    for (const b of blue ?? []) {
      const [lat, lng] = b.position
      if (
        isActiveIso(b.created_at, b.relit_at, BLUE_EXPIRY_MS) &&
        inViewport(lat, lng, region)
      ) {
        blueEmbers.push({ id: b.id, lat, lng })
      }
    }
  }

  return { embers, blueEmbers, isLoading, error, refetch }
}
