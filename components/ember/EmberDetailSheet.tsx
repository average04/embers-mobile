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
