import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.logo}>Embers</Text>
          <Text style={styles.tagline}>where you can light your thoughts</Text>
        </View>
        <View>{children}</View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080808',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 100,
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontFamily: 'CormorantGaramond_300Light',
    fontSize: 52,
    color: '#ffffff',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 12,
    color: '#3a3a4a',
    fontStyle: 'italic',
    marginTop: 8,
  },
})
