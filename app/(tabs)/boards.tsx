import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TopBar } from '@/components/navigation/TopBar'

export default function BoardsScreen() {
  return (
    <View style={styles.container}>
      <TopBar />
      <Text style={styles.text}>Boards</Text>
      <Text style={styles.sub}>Trending & Recent — Coming Soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, color: '#f97316', fontWeight: '700' },
  sub: { fontSize: 14, color: '#4a5568', marginTop: 8 },
})
