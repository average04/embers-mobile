import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { timeAgo } from '@/lib/emberUtils'

export type ProfileEmber = {
  id: string
  thought: string
  ember_type: string | null
  created_at: string
  relight_count: number
}

const TYPE_LABELS: Record<string, string> = {
  thought: 'Thought',
  confession: 'Confession',
  secret: 'Secret',
  question: 'Question',
  memory: 'Memory',
  dream: 'Dream',
  rant: 'Rant',
  gratitude: 'Gratitude',
}

const TYPE_COLOR = 'rgba(255,170,60,0.85)'

function TypeIcon({ type, size = 12 }: { type: string; size?: number }) {
  switch (type) {
    case 'thought':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
        </Svg>
      )
    case 'confession':
    case 'secret':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </Svg>
      )
    case 'dream':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
        </Svg>
      )
    case 'rant':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        </Svg>
      )
    case 'gratitude':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </Svg>
      )
    case 'question':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </Svg>
      )
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </Svg>
      )
  }
}

export function EmberCard({ ember }: { ember: ProfileEmber }) {
  const label = ember.ember_type ? (TYPE_LABELS[ember.ember_type] ?? ember.ember_type) : 'Ember'

  return (
    <View style={styles.card}>
      <View style={styles.meta}>
        <View style={styles.typeBadge}>
          <TypeIcon type={ember.ember_type ?? 'question'} size={11} />
          <Text style={styles.typeLabel}>{label.toUpperCase()}</Text>
        </View>
        <Text style={styles.age}>
          {timeAgo(ember.created_at)}{ember.relight_count > 0 ? ` · ${ember.relight_count} relights` : ''}
        </Text>
      </View>
      <Text style={styles.thought} numberOfLines={4}>{ember.thought}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    padding: 12,
    gap: 7,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  typeLabel: {
    fontSize: 9,
    color: 'rgba(255,170,60,0.85)',
    letterSpacing: 0.6,
  },
  age: {
    fontSize: 9,
    color: '#4a4a5a',
  },
  thought: {
    fontSize: 12,
    color: '#bbbbbb',
    lineHeight: 18.6,
  },
})
