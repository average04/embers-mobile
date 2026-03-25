import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'

export default function ProfileTab() {
  const router = useRouter()
  const { signOut } = useAuth()
  const profile = useAuthStore((s) => s.profile)

  return (
    <View style={styles.container}>
      <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
      <Text style={styles.sub}>Profile coming soon</Text>
      <TouchableOpacity onPress={() => router.push('/profile/settings')} style={styles.link}>
        <Text style={styles.linkText}>Settings →</Text>
      </TouchableOpacity>
      <Button label="Sign out" variant="secondary" onPress={signOut} style={styles.signout} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  username: { fontSize: 24, color: '#f7fafc', fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: 14, color: '#4a5568', marginBottom: 32 },
  link: { marginBottom: 32 },
  linkText: { color: '#f97316', fontSize: 16 },
  signout: { width: '100%' },
})
