import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { timeAgo } from '@/lib/emberUtils'

export type ProfileBlueEmber = {
  id: string
  title: string
  audio_duration: number
  created_at: string
  relight_count: number
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function BlueEmberCard({ blueEmber }: { blueEmber: ProfileBlueEmber }) {
  return (
    <View style={styles.card}>
      <View style={styles.meta}>
        <View style={styles.badge}>
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.85)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </Svg>
          <Text style={styles.badgeText}>BLUE EMBER</Text>
        </View>
        <Text style={styles.duration}>{formatDuration(blueEmber.audio_duration)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{blueEmber.title}</Text>
      <Text style={styles.age}>
        {timeAgo(blueEmber.created_at)}{blueEmber.relight_count > 0 ? ` · ${blueEmber.relight_count} relights` : ''}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0f1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a2030',
    padding: 12,
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontSize: 9,
    color: 'rgba(96,165,250,0.85)',
    letterSpacing: 0.6,
  },
  duration: {
    fontSize: 9,
    color: '#3b82f6',
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 13,
    color: '#93c5fd',
    lineHeight: 19,
  },
  age: {
    fontSize: 9,
    color: '#4a4a5a',
  },
})
