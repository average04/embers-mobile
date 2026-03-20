import React from 'react'
import { View, StyleSheet } from 'react-native'

interface BlueEmberMarkerViewProps {
  selected: boolean
}

/** The visual dot rendered inside a react-native-maps <Marker> for blue (audio) embers. */
export function BlueEmberMarkerView({ selected }: BlueEmberMarkerViewProps) {
  if (selected) {
    return (
      <View testID="blue-ember-marker-selected" style={styles.selectedOuter}>
        <View style={styles.selectedInner} />
      </View>
    )
  }
  return <View testID="blue-ember-marker" style={styles.dot} />
}

const styles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#60a5fa',
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectedOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#60a5fa',
    borderWidth: 2,
    borderColor: '#fff',
  },
})
