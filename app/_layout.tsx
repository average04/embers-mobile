import React, { useEffect, useState } from 'react'
import { Slot } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  useFonts,
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const { setSession, setProfile, clear } = useAuthStore()

  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_400Regular_Italic,
  })

  useEffect(() => {
    let cancelled = false
    const fallback = setTimeout(() => !cancelled && setReady(true), 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (newSession) {
          setSession(newSession)
          // fetch profile then mark ready
          ;(async () => {
            try {
              const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${newSession.user.id}&select=*`
              const res = await fetch(url, {
                headers: {
                  apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
                  Authorization: `Bearer ${newSession.access_token}`,
                },
              })
              const json = await res.json()
              const data = Array.isArray(json) ? json[0] ?? null : null
              if (!cancelled) setProfile(data as Profile | null)
            } catch (e) {
              console.warn('[Profile] fetch error:', e)
              if (!cancelled) setProfile(null)
            } finally {
              if (!cancelled) {
                clearTimeout(fallback)
                setReady(true)
              }
            }
          })()
        } else {
          clearTimeout(fallback)
          clear()
          if (!cancelled) setReady(true)
        }
      }
    )

    return () => {
      cancelled = true
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [setSession, setProfile, clear])

  if (!ready || !fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
