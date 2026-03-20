import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface ClusterMarkerViewProps {
  count: number
}

/** Bubble marker showing the number of embers in a cluster. */
export function ClusterMarkerView({ count }: ClusterMarkerViewProps) {
  const label = count > 99 ? '99+' : String(count)
  const size = count < 10 ? 36 : count < 50 ? 46 : 58

  return (
    <View
      testID="cluster-marker"
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: 'rgba(249, 115, 22, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
})
