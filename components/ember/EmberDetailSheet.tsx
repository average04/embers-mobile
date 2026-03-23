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
} from 'react-native'
import { WebView } from 'react-native-webview'
import { EmberTypeBadge } from './EmberTypeBadge'
import { daysRemaining } from '@/lib/emberUtils'
import { buildTikTokPlayerUrl } from '@/lib/tiktok'
import type { MapEmber } from '@/hooks/useMapEmbers'

const SCREEN_WIDTH = Dimensions.get('window').width

interface EmberDetailSheetProps {
  ember: MapEmber
  onDismiss: () => void
}

export function EmberDetailSheet({ ember, onDismiss }: EmberDetailSheetProps) {
  const days = daysRemaining(ember.created_at, ember.relit_at, 30)
  const photos = ember.photo_urls ?? []
  const tiktokUrl = ember.show_tiktok && ember.tiktok_link
    ? buildTikTokPlayerUrl(ember.tiktok_link)
    : null

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
          {/* TikTok video background */}
          {tiktokUrl && (
            <View style={styles.videoBackground}>
              <WebView
                source={{ uri: tiktokUrl }}
                style={styles.video}
                originWhitelist={['*']}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                scrollEnabled={false}
                pointerEvents="none"
              />
              <View style={styles.videoDim} />
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <EmberTypeBadge type={ember.ember_type} />
            <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Photos (shown instead of TikTok) */}
            {photos.length > 0 && (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {photos.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.photo} resizeMode="cover" />
                ))}
              </ScrollView>
            )}

            {/* Thought */}
            <Text style={[styles.thought, tiktokUrl && styles.thoughtOnVideo]}>
              {ember.thought}
            </Text>

            {/* Meta */}
            <View style={styles.meta}>
              <Text style={styles.metaText}>@{ember.username ?? 'unknown'}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>🔁 {ember.relight_count} relights</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={[styles.metaText, days <= 3 && styles.urgentText]}>
                {days === 0 ? 'Fading today' : `${days}d left`}
              </Text>
            </View>
          </ScrollView>
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
    maxHeight: '80%',
    overflow: 'hidden',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: 'hidden',
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
    transform: [{ scale: 2.5 }],
  },
  videoDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: { fontSize: 16, color: 'rgba(255,255,255,0.5)' },
  photoScroll: { marginBottom: 16, marginHorizontal: -20 },
  photo: { width: SCREEN_WIDTH - 88, height: 180, borderRadius: 8 },
  thought: {
    fontSize: 17,
    color: '#f0f0f0',
    lineHeight: 26,
    marginBottom: 16,
  },
  thoughtOnVideo: {
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaText: { fontSize: 12, color: '#4a5568' },
  metaDot: { fontSize: 12, color: '#2d3748' },
  urgentText: { color: '#f97316' },
})
