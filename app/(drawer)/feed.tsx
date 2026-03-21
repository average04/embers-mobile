import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Feed</Text>
      <Text style={styles.sub}>Coming in Phase 4</Text>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, color: '#e94560', fontWeight: '700' },
  sub: { fontSize: 14, color: '#4a5568', marginTop: 8 },
})
