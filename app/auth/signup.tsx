import React, { useState } from 'react'
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { useAuth } from '@/hooks/useAuth'

export default function SignupScreen() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({})
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

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
    if (!captchaToken) {
      Alert.alert('Please complete the security check')
      return
    }
    setLoading(true)
    const { error } = await signUp(email.trim(), password, captchaToken)
    setLoading(false)
    if (error) {
      Alert.alert('Signup failed', error)
      setCaptchaToken(null)
    } else {
      Alert.alert(
        'Check your email',
        'A confirmation email has been sent. Click the link to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      )
    }
  }

  return (
    <AuthLayout>
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.email} />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" error={errors.password} />
      <Input label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry error={errors.confirm} />
      <TurnstileWidget
        onToken={setCaptchaToken}
        onExpired={() => setCaptchaToken(null)}
      />
      <Button
        label={captchaToken ? 'Create account' : 'Complete the security check'}
        onPress={handleSignUp}
        loading={loading}
        style={styles.button}
      />
      <TouchableOpacity onPress={() => router.back()} style={styles.switchLink}>
        <Text style={styles.switchText}>
          Already have an account?{' '}
          <Text style={styles.switchAction}>Sign in</Text>
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/')} style={styles.homeLink}>
        <Text style={styles.homeText}>Home</Text>
      </TouchableOpacity>
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  button: { marginTop: 8 },
  switchLink: { alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 11, color: '#3a3a4a' },
  switchAction: { color: '#f97316' },
  homeLink: { alignItems: 'center', marginTop: 12 },
  homeText: { fontSize: 11, color: '#3a3a4a' },
})
