import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { EMBER_TYPES, EMBER_TYPE_INFO, type EmberType } from '@/constants/emberTypes'

interface EmberTypeBadgeProps {
  type: string | null
}

/** Pill badge showing the ember type emoji and label. Used in detail sheets. */
export function EmberTypeBadge({ type }: EmberTypeBadgeProps) {
  const isValid = type !== null && (EMBER_TYPES as readonly string[]).includes(type)
  const info = isValid ? EMBER_TYPE_INFO[type as EmberType] : null

  return (
    <View testID="ember-type-badge" style={styles.badge}>
      {info && <Text style={styles.emoji}>{info.emoji}</Text>}
      <Text style={styles.label}>{info ? info.label : 'Unknown'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  emoji: { fontSize: 14 },
  label: { fontSize: 13, color: '#a0aec0', fontWeight: '600' },
})
