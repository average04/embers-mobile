import React, { useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/authStore'

export default function WelcomeScreen() {
  const router = useRouter()
  const { session, profile } = useAuthStore()

  // Skip welcome screen for authenticated users who have completed setup
  useEffect(() => {
    if (session && profile?.username) {
      router.replace('/(drawer)/map')
    }
  }, [session, profile])

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Embers</Text>
      <Text style={styles.tagline}>where you can light your thoughts</Text>
      <TouchableOpacity
        style={styles.goButton}
        onPress={() => router.replace('/(drawer)/map')}
        activeOpacity={0.7}
      >
        <Text style={styles.goText}>GO</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    color: '#ffffff',
    letterSpacing: 2,
    fontFamily: 'CormorantGaramond_300Light',
  },
  tagline: {
    fontSize: 12,
    color: '#4a4a5a',
    fontStyle: 'italic',
    marginTop: 8,
  },
  goButton: {
    marginTop: 48,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  goText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 2,
  },
})
