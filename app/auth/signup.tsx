import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function SignupScreen() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({})

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword) newErrors.confirm = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSignUp() {
    if (!validate()) return
    setLoading(true)
    const { error } = await signUp(email.trim(), password)
    setLoading(false)
    if (error) {
      Alert.alert('Signup failed', error)
    } else {
      Alert.alert('Check your email', 'A confirmation email has been sent. Click the link to verify your account.', [{ text: 'OK', onPress: () => router.replace('/auth/login') }])
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>embers</Text>
        <Text style={styles.heading}>Create account</Text>
        <View style={styles.form}>
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.email} />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" error={errors.password} />
          <Input label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry error={errors.confirm} />
          <Button label="Create account" onPress={handleSignUp} loading={loading} />
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.switchLink}>
          <Text style={styles.switchText}>Already have an account? <Text style={styles.switchAction}>Sign in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f1117' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 42, fontWeight: '800', color: '#e94560', textAlign: 'center', marginBottom: 4 },
  heading: { fontSize: 20, color: '#a0aec0', textAlign: 'center', marginBottom: 48 },
  form: { gap: 0 },
  switchLink: { marginTop: 32, alignItems: 'center' },
  switchText: { color: '#718096', fontSize: 14 },
  switchAction: { color: '#e94560', fontWeight: '600' },
})
