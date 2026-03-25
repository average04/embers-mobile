import React from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? ''
const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL ?? ''
const WIDGET_URL = `${WEB_APP_URL}/turnstile.html?sitekey=${SITE_KEY}`

interface Props {
  onToken: (token: string) => void
  onExpired?: () => void
}

export function TurnstileWidget({ onToken, onExpired }: Props) {
  console.log('[Turnstile] rendering, URL:', WIDGET_URL)

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      if (msg.type === 'TOKEN') onToken(msg.token)
      else if (msg.type === 'EXPIRED') onExpired?.()
    } catch {}
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: WIDGET_URL }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        scrollEnabled={false}
        onError={(e) => console.log('[Turnstile] WebView error:', e.nativeEvent)}
        onHttpError={(e) => console.log('[Turnstile] HTTP error:', e.nativeEvent.statusCode, e.nativeEvent.url)}
        onLoad={() => console.log('[Turnstile] Page loaded:', WIDGET_URL)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 70,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#111114',
  },
})
