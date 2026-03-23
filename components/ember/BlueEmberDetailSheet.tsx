import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />

      <View style={styles.centeredWrapper} pointerEvents="box-none">
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeEmoji}>🎙️</Text>
              <Text style={styles.typeLabel}>Audio Ember</Text>
            </View>
            <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  centeredWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    backgroundColor: '#0d1a2e',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  typeEmoji: { fontSize: 13 },
  typeLabel: { fontSize: 12, color: '#60a5fa', fontWeight: '600' },
  closeBtn: { fontSize: 16, color: '#3a3a4a' },
  title: {
    fontSize: 17,
    color: '#f0f0f0',
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
  metaText: { fontSize: 12, color: '#4a5568' },
  metaDot: { fontSize: 12, color: '#2d3748' },
  urgentText: { color: '#60a5fa' },
})
