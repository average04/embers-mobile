import React, { useState } from 'react'
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
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

  return (
    <AuthLayout>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        error={errors.email}
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        error={errors.password}
      />
      <TouchableOpacity
        onPress={() => router.push('/auth/forgot-password')}
        style={styles.forgotRow}
      >
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>
      <Button label="Sign in" onPress={handleSignIn} loading={loading} style={styles.button} />
      <TouchableOpacity onPress={() => router.push('/auth/signup')} style={styles.switchLink}>
        <Text style={styles.switchText}>
          Don't have an account?{' '}
          <Text style={styles.switchAction}>Sign up</Text>
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/')} style={styles.homeLink}>
        <Text style={styles.homeText}>Home</Text>
      </TouchableOpacity>
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 11,
    color: '#f97316',
  },
  button: {
    marginTop: 16,
  },
  switchLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    fontSize: 11,
    color: '#3a3a4a',
  },
  switchAction: {
    color: '#f97316',
  },
  homeLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  homeText: {
    fontSize: 11,
    color: '#3a3a4a',
  },
})
