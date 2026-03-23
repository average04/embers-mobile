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
          color={variant === 'primary' ? '#fff' : '#f97316'}
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primary: { backgroundColor: '#f97316' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#f97316' },
  destructive: { backgroundColor: '#7f1d1d' },
  disabled: { opacity: 0.5 },
  label: { fontSize: 14, fontWeight: '500' },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: '#f97316' },
  destructiveLabel: { color: '#fca5a5' },
})
