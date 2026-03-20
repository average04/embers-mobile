import React, { useEffect, useState } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [initialized, setInitialized] = useState(false)
  const { session, profile, setSession, setProfile, clear } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
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
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!initialized) return

    SplashScreen.hideAsync()

    const inAuthGroup = segments[0] === 'auth'

    if (!session) {
      if (!inAuthGroup) router.replace('/auth/login')
    } else if (!profile?.username) {
      if (segments[1] !== 'setup-username') router.replace('/auth/setup-username')
    } else if (inAuthGroup) {
      router.replace('/(tabs)/map')
    }
  }, [initialized, session, profile])

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  )
}
