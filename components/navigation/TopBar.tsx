import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useNavigationState } from '@react-navigation/native'
import { DrawerNavigationProp } from '@react-navigation/drawer'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/authStore'

export function TopBar() {
  const navigation = useNavigation<DrawerNavigationProp<Record<string, undefined>>>()
  const router = useRouter()
  const { session, profile } = useAuthStore()

  // Track drawer open/closed state
  const drawerStatus = useNavigationState((state) => {
    // expo-router drawer sets history entries when open
    return state?.history?.some((h: { type: string }) => h.type === 'drawer') ?? false
  })

  const isDrawerOpen = drawerStatus

  function toggleDrawer() {
    if (isDrawerOpen) {
      navigation.closeDrawer()
    } else {
      navigation.openDrawer()
    }
  }

  function handleProfilePress() {
    if (session) {
      router.push('/(drawer)/profile')
    } else {
      router.push('/auth/login')
    }
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Hamburger / Close */}
      <TouchableOpacity style={styles.hamburger} onPress={toggleDrawer} activeOpacity={0.8}>
        {isDrawerOpen ? (
          <Text style={styles.closeIcon}>✕</Text>
        ) : (
          <View style={styles.lines}>
            <View style={styles.line} />
            <View style={styles.line} />
            <View style={styles.line} />
          </View>
        )}
      </TouchableOpacity>

      {/* Profile pill */}
      <TouchableOpacity style={styles.profilePill} onPress={handleProfilePress} activeOpacity={0.8}>
        {/* Avatar circle */}
        <View style={styles.avatar}>
          {!session && <Text style={styles.guestIcon}>👤</Text>}
        </View>
        <Text style={[styles.profileLabel, !session && styles.guestLabel]}>
          {session && profile?.username ? `@${profile.username}` : 'Sign in'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52, // below status bar
    paddingBottom: 8,
    zIndex: 100,
  },
  hamburger: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lines: {
    gap: 4,
    alignItems: 'center',
  },
  line: {
    width: 13,
    height: 1,
    backgroundColor: '#aaaaaa',
  },
  closeIcon: {
    fontSize: 14,
    color: '#aaaaaa',
    lineHeight: 16,
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
  guestIcon: {
    fontSize: 11,
  },
  profileLabel: {
    fontSize: 11,
    color: '#aaaaaa',
    letterSpacing: 0.5,
  },
  guestLabel: {
    color: '#3a3a4a',
  },
})
