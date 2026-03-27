import React, { useState, useRef, useEffect, useCallback } from 'react'
import { StyleSheet, View, Text, Animated, TouchableOpacity, Platform } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { TopBar } from '@/components/navigation/TopBar'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import * as Location from 'expo-location'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMapStore, type Region } from '@/store/mapStore'
import { useMapEmbers, type MapEmber, type MapBlueEmber } from '@/hooks/useMapEmbers'
import { EmberDetailSheet } from '@/components/ember/EmberDetailSheet'
import { TAB_BAR_HEIGHT } from '@/components/navigation/BottomTabBar'
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

  const { embers, blueEmbers, allEmbers, allBlueEmbers, isLoading } = useMapEmbers(queryRegion)
  const spinAnim = useRef(new Animated.Value(0)).current
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null)
  const queryClient = useQueryClient()
  const flickerAnim = useRef(new Animated.Value(1)).current
  const [searchOpen, setSearchOpen] = useState(false)

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
        .select('id, thought, lat, lng, ember_type, user_id, username, created_at, relit_at, relight_count, photo_urls, tiktok_link, show_tiktok, view_count')
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

      {/* Floating action bar */}
      <View style={styles.actionBarWrapper} pointerEvents="box-none">
        {/* Single pill bar */}
        <View style={styles.actionBar} pointerEvents="box-none">
          {/* Search */}
          <TouchableOpacity style={styles.actionSide} onPress={() => setSearchOpen(v => !v)} activeOpacity={0.7} pointerEvents="auto">
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={searchOpen ? '#f97316' : '#888'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </Svg>
            <Text style={[styles.actionLabel, searchOpen && { color: '#f97316' }]}>Search</Text>
          </TouchableOpacity>

          {/* Center spacer for Add button */}
          <View style={styles.actionCenterGap} />

          {/* Random */}
          <TouchableOpacity
            style={styles.actionSide}
            activeOpacity={0.7}
            pointerEvents="auto"
            onPress={() => {
              const all = [
                ...allEmbers.map(e => ({ id: e.id, lat: e.lat, lng: e.lng, kind: 'orange' as const })),
                ...allBlueEmbers.map(b => ({ id: b.id, lat: b.lat, lng: b.lng, kind: 'blue' as const })),
              ]
              if (!all.length) return
              const pick = all[Math.floor(Math.random() * all.length)]

              spinAnim.setValue(0)
              spinLoopRef.current = Animated.loop(
                Animated.timing(spinAnim, { toValue: 1, duration: 600, useNativeDriver: true })
              )
              spinLoopRef.current.start()

              webViewRef.current?.postMessage(JSON.stringify({ type: 'FLY_TO', lat: pick.lat, lng: pick.lng, zoom: 15 }))
              setTimeout(() => {
                spinLoopRef.current?.stop()
                spinAnim.setValue(0)
                setSelectedEmber(pick.id, pick.kind)
              }, 1300)
            }}
          >
            <Animated.View style={{ transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </Svg>
            </Animated.View>
            <Text style={styles.actionLabel}>Random</Text>
          </TouchableOpacity>
        </View>

        {/* Add button — centered, elevated above bar */}
        <TouchableOpacity style={styles.actionAdd} activeOpacity={0.8} pointerEvents="auto">
          <Text style={styles.actionAddIcon}>+</Text>
          <Text style={styles.actionAddLabel}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search panel */}
      {searchOpen && (
        <View style={styles.searchWrapper}>
          <LocationSearch
            onSelect={(newRegion) => {
              setRegion(newRegion)
              setQueryRegion(newRegion)
              setSearchOpen(false)
              webViewRef.current?.postMessage(JSON.stringify({
                type: 'JUMP_TO',
                lat: newRegion.latitude,
                lng: newRegion.longitude,
                zoom: 13,
              }))
            }}
          />
        </View>
      )}

      {isLoading && (
        <Animated.View style={[styles.loadingBadge, { opacity: flickerAnim }]}>
          <Text style={styles.loadingText}>lighting up the map...</Text>
        </Animated.View>
      )}

      {selectedEmber && (
        <EmberDetailSheet ember={selectedEmber} onDismiss={handleDismiss} tabBarHeight={TAB_BAR_HEIGHT} />
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
  actionBarWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 90,
    right: 90,
    height: 72,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: 'rgba(12,12,12,0.92)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#252525',
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionSide: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  actionCenterGap: {
    width: 60,
  },
  actionLabel: {
    fontSize: 9,
    color: '#888',
    letterSpacing: 0.2,
  },
  actionAdd: {
    position: 'absolute',
    top: 4,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  actionAddIcon: {
    fontSize: 22,
    color: '#fff',
    lineHeight: 26,
    marginBottom: -3,
  },
  actionAddLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  searchWrapper: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  loadingBadge: {
    position: 'absolute',
    top: 90,
    left: 16,
  },
  loadingText: {
    fontSize: 11,
    color: '#f97316',
    letterSpacing: 0.5,
  },
})
