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
      activeOpacity={0.8}
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
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primary: {
    backgroundColor: '#f97316',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.4)',
  },
  destructive: {
    backgroundColor: '#7f1d1d',
  },
  disabled: { opacity: 0.4 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: '#f97316' },
  destructiveLabel: { color: '#fca5a5' },
})
