import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import MapView, { Marker, type Region } from 'react-native-maps'
import Supercluster from 'supercluster'
import { useMapStore } from '@/store/mapStore'
import { useMapEmbers } from '@/hooks/useMapEmbers'
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

  const sc = useRef(new Supercluster<{ id: string; kind: 'orange' | 'blue' }>({ radius: 40, maxZoom: 16 }))
  useEffect(() => { sc.current.load(features) }, [features])

  const clusters = useMemo(() => {
    try {
      return sc.current.getClusters(regionToBounds(region), regionToZoom(region))
    } catch {
      return []
    }
  }, [region, features])

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
          const props = cluster.properties as any

          if (props.cluster) {
            return (
              <Marker
                key={`cluster-${props.cluster_id}`}
                coordinate={{ latitude: lat, longitude: lng }}
                tracksViewChanges={false}
              >
                <ClusterMarkerView count={props.point_count} />
              </Marker>
            )
          }

          const emberId = props.id as string
          const emberKind = props.kind as 'orange' | 'blue'
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
