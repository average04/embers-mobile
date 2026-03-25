import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label: string
  error?: string
}

export function Input({ label, error, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor="#333340"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    color: '#555566',
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#f0f0f0',
    letterSpacing: 0.2,
  },
  inputFocused: {
    borderColor: 'rgba(249,115,22,0.4)',
    backgroundColor: 'rgba(249,115,22,0.03)',
  },
  inputError: {
    borderColor: 'rgba(248,113,113,0.5)',
  },
  error: {
    fontSize: 11,
    color: '#f87171',
    marginTop: 6,
    letterSpacing: 0.2,
  },
})
