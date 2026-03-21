import React, { useState } from 'react'
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  async function handleSend() {
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    setLoading(true)
    const { error: resetError } = await resetPassword(email.trim())
    setLoading(false)
    if (resetError) {
      setError(resetError)
    } else {
      Alert.alert('Check your email', 'A password reset link has been sent to ' + email.trim(), [
        { text: 'OK', onPress: () => router.back() },
      ])
    }
  }

  return (
    <AuthLayout>
      <Text style={styles.heading}>Reset password</Text>
      <Text style={styles.subtext}>Enter your email and we'll send a reset link</Text>
      <Input
        label="Email"
        value={email}
        onChangeText={(text) => { setEmail(text); setError(undefined) }}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        error={error}
      />
      <Button label="Send reset link" onPress={handleSend} loading={loading} style={styles.button} />
      <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backText}>Back to sign in</Text>
      </TouchableOpacity>
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 15, fontWeight: '600', color: '#ffffff', marginBottom: 4 },
  subtext: { fontSize: 12, color: '#3a3a4a', marginBottom: 16 },
  button: { marginTop: 8 },
  backLink: { alignItems: 'center', marginTop: 20 },
  backText: { fontSize: 11, color: '#3a3a4a' },
})
