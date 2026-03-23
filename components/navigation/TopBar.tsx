import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/authStore'

export function TopBar() {
  const router = useRouter()
  const { session, profile } = useAuthStore()

  function handleProfilePress() {
    if (session) {
      router.push('/(drawer)/profile')
    } else {
      router.push('/auth/login')
    }
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {session && profile?.username ? (
        <TouchableOpacity style={styles.profilePill} onPress={handleProfilePress} activeOpacity={0.8}>
          <View style={styles.avatar} />
          <Text style={styles.profileLabel}>@{profile.username}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.signInBtn} onPress={handleProfilePress} activeOpacity={0.8}>
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 8,
    zIndex: 100,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
    paddingLeft: 5,
    paddingRight: 10,
    paddingVertical: 5,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLabel: {
    fontSize: 11,
    color: '#aaaaaa',
    letterSpacing: 0.5,
  },
  signInBtn: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  signInText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
})
