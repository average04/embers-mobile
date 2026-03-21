import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useNotifStore } from '@/store/notifStore'

const NAV_ITEMS = [
  { label: 'Map', route: '/(drawer)/map' },
  { label: 'Feed', route: '/(drawer)/feed' },
  { label: 'Alerts', route: '/(drawer)/notifications' },
] as const

export function DrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const router = useRouter()
  const { clear } = useAuthStore()
  const unreadCount = useNotifStore((s) => s.unreadCount)

  // Map drawer route names to our nav items
  const activeRouteName = state.routeNames[state.index]

  function getActiveLabel(): string {
    if (activeRouteName === 'map') return 'Map'
    if (activeRouteName === 'feed') return 'Feed'
    if (activeRouteName === 'notifications') return 'Alerts'
    return ''
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          clear()
          navigation.closeDrawer()
          router.replace('/')
        },
      },
    ])
  }

  const activeLabel = getActiveLabel()

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === activeLabel
          return (
            <TouchableOpacity
              key={item.label}
              style={styles.navItem}
              onPress={() => {
                router.replace(item.route)
                navigation.closeDrawer()
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, isActive && styles.dotActive]} />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
              {item.label === 'Alerts' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      <TouchableOpacity onPress={handleSignOut} activeOpacity={0.5}>
        <Text style={styles.signOut}>SIGN OUT</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    borderRightWidth: 1,
    borderRightColor: '#141414',
    paddingTop: 80,
    paddingBottom: 40,
  },
  nav: {
    flex: 1,
    paddingHorizontal: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: '#ffffff',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#3a3a4a',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  navLabelActive: {
    fontWeight: '600',
    color: '#ffffff',
  },
  badge: {
    marginLeft: 'auto',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '600',
  },
  signOut: {
    fontSize: 10,
    color: '#252525',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
  },
})
