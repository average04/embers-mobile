import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import * as Location from 'expo-location'
import { useQueryClient } from '@tanstack/react-query'
import { useMapStore, type Region } from '@/store/mapStore'
import { useMapEmbers } from '@/hooks/useMapEmbers'
import { EmberDetailSheet } from '@/components/ember/EmberDetailSheet'
import { BlueEmberDetailSheet } from '@/components/ember/BlueEmberDetailSheet'
import { LocationSearch } from '@/components/map/LocationSearch'
import { supabase } from '@/lib/supabase/client'
import { buildMapHtml } from '@/lib/leafletMap'

const DEFAULT_ZOOM = 11
const MAP_HTML = buildMapHtml(14.5995, 120.9842, DEFAULT_ZOOM)

export default function MapScreen() {
  const { region, setRegion, selectedEmberId, selectedEmberType, setSelectedEmber } = useMapStore()
  const [queryRegion, setQueryRegion] = useState(region)
  const [mapReady, setMapReady] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const webViewRef = useRef<WebView>(null)

  const { embers, blueEmbers, isLoading } = useMapEmbers(queryRegion)
  const queryClient = useQueryClient()

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

  const sendEmbers = useCallback(() => {
    if (!webViewRef.current) return
    const markerData = [
      ...embers.map((e) => ({ id: e.id, lat: e.lat, lng: e.lng, kind: 'orange' as const })),
      ...blueEmbers.map((b) => ({ id: b.id, lat: b.lat, lng: b.lng, kind: 'blue' as const })),
    ]
    webViewRef.current.postMessage(JSON.stringify({
      type: 'UPDATE_EMBERS',
      embers: markerData,
      location: userLocation,
    }))
  }, [embers, blueEmbers, userLocation])

  useEffect(() => {
    if (mapReady) sendEmbers()
  }, [mapReady, sendEmbers])

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

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data)

      if (msg.type === 'MAP_READY') {
        setMapReady(true)
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

  const handleDismiss = useCallback(() => {
    setSelectedEmber(null, null)
  }, [setSelectedEmber])

  const embersById = useMemo(() => new Map(embers.map((e) => [e.id, e])), [embers])
  const blueEmbersById = useMemo(() => new Map(blueEmbers.map((b) => [b.id, b])), [blueEmbers])

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
