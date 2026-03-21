import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top hero */}
      <View style={styles.hero}>
        <Text style={styles.logo}>
          Embers
        </Text>
        <Text style={styles.tagline}>where you can light your thoughts</Text>
        <View style={styles.rule} />
      </View>

      {/* Bottom form panel */}
      <View style={styles.panel}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.panelContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080808',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 48,
    color: '#ffffff',
    letterSpacing: 2,
    fontFamily: 'CormorantGaramond_300Light',
  },
  tagline: {
    fontSize: 12,
    color: '#4a4a5a',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  rule: {
    width: 28,
    height: 1,
    backgroundColor: '#e94560',
    opacity: 0.5,
    marginTop: 16,
  },
  panel: {
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#161616',
  },
  panelContent: {
    padding: 24,
  },
})
