import React, { useState, useRef, useEffect, useCallback } from 'react'
import { StyleSheet, View, Text, Animated } from 'react-native'
import { TopBar } from '@/components/navigation/TopBar'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import * as Location from 'expo-location'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMapStore, type Region } from '@/store/mapStore'
import { useMapEmbers, type MapEmber, type MapBlueEmber } from '@/hooks/useMapEmbers'
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
  const flickerAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!isLoading) return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(flickerAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [isLoading, flickerAnim])

  // Fetch full ember detail from Supabase only when a marker is tapped
  const { data: selectedEmber } = useQuery<MapEmber | null>({
    queryKey: ['ember', selectedEmberId],
    queryFn: async () => {
      const { data } = await supabase
        .from('embers')
        .select('id, thought, lat, lng, ember_type, user_id, username, created_at, relit_at, relight_count, photo_urls, tiktok_link, show_tiktok')
        .eq('id', selectedEmberId!)
        .single()
      return data as MapEmber | null
    },
    enabled: !!selectedEmberId && selectedEmberType === 'orange',
    staleTime: 60_000,
  })

  const { data: selectedBlueEmber } = useQuery<MapBlueEmber | null>({
    queryKey: ['blueEmber', selectedEmberId],
    queryFn: async () => {
      const { data } = await supabase
        .from('blue_embers')
        .select('id, title, audio_url, audio_duration, lat, lng, user_id, username, created_at, relit_at, relight_count')
        .eq('id', selectedEmberId!)
        .single()
      return data as MapBlueEmber | null
    },
    enabled: !!selectedEmberId && selectedEmberType === 'blue',
    staleTime: 60_000,
  })

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


  return (
    <View style={styles.container}>
      <TopBar />

      {/* Embers logo */}
      <View style={styles.logoBlock} pointerEvents="none">
        <Text style={styles.logoText}>Embers</Text>
      </View>

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

      <View style={styles.searchWrapper}>
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
      </View>

      {isLoading && (
        <Animated.View style={[styles.loadingBadge, { opacity: flickerAnim }]}>
          <Text style={styles.loadingText}>lighting up the map...</Text>
        </Animated.View>
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
  logoBlock: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 100,
  },
  logoText: {
    fontFamily: 'CormorantGaramond_300Light',
    fontSize: 28,
    color: '#f0f0f0',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  searchWrapper: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  loadingBadge: {
    position: 'absolute',
    top: 108,
    right: 16,
  },
  loadingText: {
    fontSize: 11,
    color: '#f97316',
    letterSpacing: 0.5,
  },
})
