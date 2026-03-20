import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn, sendMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email'
    if (!password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSignIn() {
    if (!validate()) return
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) Alert.alert('Login failed', error)
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email to receive a magic link' })
      return
    }
    setMagicLinkLoading(true)
    const { error } = await sendMagicLink(email.trim())
    setMagicLinkLoading(false)
    if (error) {
      Alert.alert('Error', error)
    } else {
      Alert.alert('Check your email', 'A magic link has been sent to ' + email.trim())
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>embers</Text>
        <Text style={styles.tagline}>thoughts left on the map</Text>
        <View style={styles.form}>
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.email} />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" error={errors.password} />
          <Button label="Sign in" onPress={handleSignIn} loading={loading} />
          <Button label="Send magic link" variant="secondary" onPress={handleMagicLink} loading={magicLinkLoading} style={styles.secondaryButton} />
        </View>
        <TouchableOpacity onPress={() => router.push('/auth/signup')} style={styles.switchLink}>
          <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchAction}>Sign up</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f1117' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 42, fontWeight: '800', color: '#e94560', textAlign: 'center', marginBottom: 4 },
  tagline: { fontSize: 14, color: '#4a5568', textAlign: 'center', marginBottom: 48 },
  form: { gap: 0 },
  secondaryButton: { marginTop: 12 },
  switchLink: { marginTop: 32, alignItems: 'center' },
  switchText: { color: '#718096', fontSize: 14 },
  switchAction: { color: '#e94560', fontWeight: '600' },
})
