import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useNotifStore } from '@/store/notifStore'
import { TopBar } from '@/components/navigation/TopBar'
export default function NotificationsScreen() {
  const reset = useNotifStore((s) => s.reset)
  useEffect(() => { reset() }, [reset])
  return (
    <View style={styles.container}>
      <TopBar />
      <Text style={styles.text}>Notifications</Text>
      <Text style={styles.sub}>Coming in Phase 5</Text>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, color: '#f97316', fontWeight: '700' },
  sub: { fontSize: 14, color: '#4a5568', marginTop: 8 },
})
