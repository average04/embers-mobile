import React, { useState } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH, USERNAME_REGEX } from '@/constants/validation'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function SetupUsernameScreen() {
  const { session, setProfile } = useAuthStore()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(): boolean {
    if (!username.trim()) { setError('Username is required'); return false }
    if (username.length < MIN_USERNAME_LENGTH) { setError(`Username must be at least ${MIN_USERNAME_LENGTH} characters`); return false }
    if (username.length > MAX_USERNAME_LENGTH) { setError(`Username must be ${MAX_USERNAME_LENGTH} characters or less`); return false }
    if (!USERNAME_REGEX.test(username)) {
      setError('Username can only contain letters, numbers, underscores and periods')
      return false
    }
    if (username.startsWith('.') || username.endsWith('.')) {
      setError('Username cannot start or end with a period')
      return false
    }
    if (username.includes('..')) {
      setError('Username cannot contain consecutive periods')
      return false
    }
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
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.logo}>embers</Text>
        <Text style={styles.heading}>Choose a username</Text>
        <Text style={styles.subheading}>This is how others will see you on the map.</Text>
        <Input label="Username" value={username} onChangeText={(text) => { setUsername(text); setError(null) }} autoCapitalize="none" autoCorrect={false} error={error ?? undefined} placeholder="e.g. jayrb" />
        <Button label="Save username" onPress={handleSave} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f1117' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 42, fontWeight: '800', color: '#e94560', textAlign: 'center', marginBottom: 4 },
  heading: { fontSize: 24, color: '#f7fafc', textAlign: 'center', marginBottom: 8, fontWeight: '700' },
  subheading: { fontSize: 14, color: '#718096', textAlign: 'center', marginBottom: 40 },
})
