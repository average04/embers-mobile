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
