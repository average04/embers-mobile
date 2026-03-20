import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useNotifStore } from '@/store/notifStore'
export default function NotificationsScreen() {
  const reset = useNotifStore((s) => s.reset)
  useEffect(() => { reset() }, [])
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Notifications</Text>
      <Text style={styles.sub}>Coming in Phase 5</Text>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, color: '#e94560', fontWeight: '700' },
  sub: { fontSize: 14, color: '#4a5568', marginTop: 8 },
})
