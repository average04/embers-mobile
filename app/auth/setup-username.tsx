import React, { useState } from 'react'
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH, USERNAME_REGEX } from '@/constants/validation'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function SetupUsernameScreen() {
  const router = useRouter()
  const { session, profile, setProfile } = useAuthStore()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (profile?.username) router.replace('/(tabs)/map')
  }, [profile?.username])

  function validate(): boolean {
    if (!username.trim()) { setError('Username is required'); return false }
    if (username.length < MIN_USERNAME_LENGTH) { setError(`At least ${MIN_USERNAME_LENGTH} characters`); return false }
    if (username.length > MAX_USERNAME_LENGTH) { setError(`Max ${MAX_USERNAME_LENGTH} characters`); return false }
    if (!USERNAME_REGEX.test(username)) { setError('Letters, numbers, underscores and periods only'); return false }
    if (username.startsWith('.') || username.endsWith('.')) { setError('Cannot start or end with a period'); return false }
    if (username.includes('..')) { setError('Cannot contain consecutive periods'); return false }
    setError(null)
    return true
  }

  async function handleSave() {
    if (!validate() || !session) return
    setLoading(true)

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle()

    if (existing) {
      setError('This username is already taken')
      setLoading(false)
      return
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', session.user.id)
      .select()
      .single()

    setLoading(false)

    if (updateError || !updatedProfile) {
      Alert.alert('Error', updateError?.message ?? 'Failed to update profile')
      return
    }

    setProfile(updatedProfile as Profile)
    router.replace('/(tabs)/map')
  }

  return (
    <AuthLayout>
      <Text style={styles.heading}>Choose your username</Text>
      <Text style={styles.subtext}>How others will see you on the map</Text>
      <Input
        label="Username"
        value={username}
        onChangeText={(text) => { setUsername(text); setError(null) }}
        autoCapitalize="none"
        autoCorrect={false}
        error={error ?? undefined}
        placeholder="e.g. jayrb"
      />
      <Button label="Save username" onPress={handleSave} loading={loading} style={styles.button} />
      <TouchableOpacity onPress={() => router.replace('/')} style={styles.homeLink}>
        <Text style={styles.homeText}>Home</Text>
      </TouchableOpacity>
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 15, fontWeight: '600', color: '#ffffff', marginBottom: 4 },
  subtext: { fontSize: 12, color: '#3a3a4a', marginBottom: 16 },
  button: { marginTop: 8 },
  homeLink: { alignItems: 'center', marginTop: 20 },
  homeText: { fontSize: 11, color: '#3a3a4a' },
})
