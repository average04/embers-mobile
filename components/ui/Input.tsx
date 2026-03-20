import React from 'react'
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label: string
  error?: string
}

export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor="#4a5568"
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, color: '#a0aec0', marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d3748',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f7fafc',
  },
  inputError: { borderColor: '#fc8181' },
  error: { fontSize: 12, color: '#fc8181', marginTop: 4 },
})
