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

function isActive(createdAt: string, relitAt: string | null, expiryMs: number): boolean {
  const lastActive = relitAt
    ? Math.max(new Date(createdAt).getTime(), new Date(relitAt).getTime())
    : new Date(createdAt).getTime()
  return Date.now() - lastActive < expiryMs
}

async function fetchMapEmbers(region: Region): Promise<{ embers: MapEmber[]; blueEmbers: MapBlueEmber[] }> {
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
      Math.round(region.latitude * 1000) / 1000,
      Math.round(region.longitude * 1000) / 1000,
      Math.round(region.latitudeDelta * 1000) / 1000,
      Math.round(region.longitudeDelta * 1000) / 1000,
    ],
    queryFn: () => fetchMapEmbers(region),
    staleTime: 30_000,
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
