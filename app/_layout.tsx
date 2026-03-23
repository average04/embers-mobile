import React, { useEffect, useState } from 'react'
import { Slot } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  useFonts,
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
} from '@expo-google-fonts/cormorant-garamond'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function RootLayout() {
  const [initialized, setInitialized] = useState(false)
  const { setSession, setProfile, clear } = useAuthStore()

  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
  })

  useEffect(() => {
    const fallback = setTimeout(() => setInitialized(true), 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        clearTimeout(fallback)
        setSession(newSession)

        if (newSession) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single()
          setProfile(data as Profile | null)
        } else {
          clear()
        }

        setInitialized(true)
      }
    )

    return () => {
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [setSession, setProfile, clear])

  // Don't render until auth state is known and fonts are loaded
  if (!initialized || !fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
