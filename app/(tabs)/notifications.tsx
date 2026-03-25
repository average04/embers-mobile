import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function NotificationsTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, color: '#f7fafc', fontWeight: '600', marginBottom: 8 },
  sub: { fontSize: 14, color: '#4a5568' },
})
