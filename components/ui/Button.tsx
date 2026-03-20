import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native'

interface ButtonProps extends TouchableOpacityProps {
  label: string
  variant?: 'primary' | 'secondary' | 'destructive'
  loading?: boolean
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          testID="button-loading"
          size="small"
          color={variant === 'primary' ? '#fff' : '#e94560'}
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primary: { backgroundColor: '#e94560' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e94560' },
  destructive: { backgroundColor: '#7f1d1d' },
  disabled: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '600' },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: '#e94560' },
  destructiveLabel: { color: '#fca5a5' },
})
