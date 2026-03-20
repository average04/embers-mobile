import React from 'react'
import { View, StyleSheet } from 'react-native'

interface EmberMarkerViewProps {
  selected: boolean
}

/** The visual dot rendered inside a react-native-maps <Marker> for orange embers. */
export function EmberMarkerView({ selected }: EmberMarkerViewProps) {
  if (selected) {
    return (
      <View testID="ember-marker-selected" style={styles.selectedOuter}>
        <View style={styles.selectedInner} />
      </View>
    )
  }
  return <View testID="ember-marker" style={styles.dot} />
}

const styles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f97316',
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectedOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f97316',
    borderWidth: 2,
    borderColor: '#fff',
  },
})
