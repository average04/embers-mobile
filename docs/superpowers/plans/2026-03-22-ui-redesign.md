# Embers Mobile UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bottom tab navigator and old auth screens with a sidebar drawer navigator and a premium "Midnight" design — Cormorant Garamond branding, welcome screen, forgot password, and guest-friendly navigation.

**Architecture:** Expo Router v6 file-based drawer (`app/(drawer)/`) replaces `app/(tabs)/`. A transparent `TopBar` is rendered as a custom header on every drawer screen — giving hamburger + profile pill without hardcoding it in each screen. Auth screens are rewritten with a shared `AuthLayout` component (hero top half, form panel bottom half). Font loading happens in the root `_layout.tsx` via `useFonts`. The auth gate redirect is removed from `_layout.tsx` — the welcome screen handles the authenticated-user bypass.

**Tech Stack:** Expo Router v6, `expo-router/drawer` (wraps `@react-navigation/drawer`), `@expo-google-fonts/cormorant-garamond`, `expo-font`, `react-native-gesture-handler` (already installed), `react-native-reanimated` (already installed)

---

## File Map

**Created:**
```
components/auth/AuthLayout.tsx         # Shared hero+panel layout for all auth screens
components/navigation/TopBar.tsx       # Transparent overlay: hamburger + profile pill
components/navigation/DrawerContent.tsx # Custom sidebar: Map/Feed/Alerts nav + sign out
app/(drawer)/_layout.tsx               # Drawer navigator (replaces tab layout)
app/auth/forgot-password.tsx           # New forgot password screen
```

**Modified:**
```
babel.config.js                        # Add react-native-reanimated/plugin (LAST in plugins)
app/_layout.tsx                        # Add font loading; remove auth-gate redirect useEffect
app/index.tsx                          # Welcome screen with GO button (replaces redirect stub)
app/auth/login.tsx                     # New AuthLayout, forgot password link, remove magic link
app/auth/signup.tsx                    # New AuthLayout
app/auth/setup-username.tsx            # New AuthLayout
hooks/useAuth.ts                       # Add resetPassword function
__tests__/hooks/useAuth.test.ts        # Add resetPassword tests
```

**Renamed (move all files from old group to new group):**
```
app/(tabs)/ → app/(drawer)/
  _layout.tsx   (replaced, not moved — old content deleted, new drawer layout written)
  map.tsx       (moved as-is)
  feed.tsx      (moved as-is)
  notifications.tsx (moved as-is)
  profile/      (moved as-is)
```

**Deleted:**
```
app/(tabs)/_layout.tsx    (replaced by app/(drawer)/_layout.tsx)
```

---

## Task 1: Install packages and fix Babel config

**Files:**
- Modify: `babel.config.js`

No TDD here — package installation and config.

- [ ] **Step 1.1: Install drawer and font packages**

```bash
cd D:/Projects/embers-mobile
npx expo install @react-navigation/drawer
npx expo install @expo-google-fonts/cormorant-garamond expo-font
```

Expected: packages added to `package.json` and `node_modules`.

- [ ] **Step 1.2: Add reanimated Babel plugin to babel.config.js**

Open `babel.config.js`. The current content is:

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: { '@': '.' },
        },
      ],
    ],
  }
}
```

Replace entirely with:

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: { '@': '.' },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
```

> **Critical:** `react-native-reanimated/plugin` MUST be last in the plugins array. The drawer crashes at runtime without it.

- [ ] **Step 1.3: Commit**

```bash
cd D:/Projects/embers-mobile
git add babel.config.js package.json package-lock.json
git commit -m "chore: install drawer + cormorant garamond, add reanimated babel plugin"
```

---

## Task 2: Add resetPassword to useAuth hook

**Files:**
- Modify: `hooks/useAuth.ts`
- Modify: `__tests__/hooks/useAuth.test.ts`

- [ ] **Step 2.1: Read current useAuth.ts**

Read `hooks/useAuth.ts` to understand the existing hook shape before editing.

- [ ] **Step 2.2: Write failing test for resetPassword**

Open `__tests__/hooks/useAuth.test.ts`. Add this test block after the existing tests:

```ts
describe('resetPassword', () => {
  it('calls supabase resetPasswordForEmail with the email', async () => {
    const mockResetPassword = jest.fn().mockResolvedValue({ error: null })
    ;(supabase.auth.resetPasswordForEmail as jest.Mock) = mockResetPassword

    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.resetPassword('test@example.com')
    })

    expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
  })

  it('returns error message when resetPasswordForEmail fails', async () => {
    ;(supabase.auth.resetPasswordForEmail as jest.Mock) = jest.fn().mockResolvedValue({
      error: { message: 'Email not found' },
    })

    const { result } = renderHook(() => useAuth())
    let response: { error: string | null }
    await act(async () => {
      response = await result.current.resetPassword('unknown@example.com')
    })

    expect(response!.error).toBe('Email not found')
  })

  it('returns null error on success', async () => {
    ;(supabase.auth.resetPasswordForEmail as jest.Mock) = jest.fn().mockResolvedValue({
      error: null,
    })

    const { result } = renderHook(() => useAuth())
    let response: { error: string | null }
    await act(async () => {
      response = await result.current.resetPassword('test@example.com')
    })

    expect(response!.error).toBeNull()
  })
})
```

- [ ] **Step 2.3: Run to verify failure**

```bash
cd D:/Projects/embers-mobile && npm test -- useAuth
```

Expected: FAIL — `resetPassword is not a function`

- [ ] **Step 2.4: Add resetPassword to useAuth.ts**

Open `hooks/useAuth.ts`. Add `resetPassword` following the exact same pattern as `signIn`. Also remove `sendMagicLink` entirely — the login screen no longer has a magic link button and the spec explicitly removes this feature.

Add `resetPassword`:

```ts
async function resetPassword(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  return { error: error?.message ?? null }
}
```

Remove `sendMagicLink` from the hook body (delete the function entirely).

Return it from the hook: `return { signIn, signUp, signOut, resetPassword }`

- [ ] **Step 2.5: Run tests to verify pass**

```bash
cd D:/Projects/embers-mobile && npm test -- useAuth
```

Expected: All useAuth tests PASS.

- [ ] **Step 2.6: Run full suite**

```bash
cd D:/Projects/embers-mobile && npm test
```

Expected: All tests PASS.

- [ ] **Step 2.7: Commit**

```bash
cd D:/Projects/embers-mobile
git add hooks/useAuth.ts __tests__/hooks/useAuth.test.ts
git commit -m "feat: add resetPassword to useAuth hook"
```

---

## Task 3: Create shared AuthLayout component

**Files:**
- Create: `components/auth/AuthLayout.tsx`

All four auth screens (login, signup, setup-username, forgot-password) share the same hero + sliding panel layout. This component encapsulates it.

No Jest test — pure visual layout component, no logic.

- [ ] **Step 3.1: Create components/auth/AuthLayout.tsx**

```tsx
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
```

- [ ] **Step 3.2: Commit**

```bash
cd D:/Projects/embers-mobile
git add components/auth/AuthLayout.tsx
git commit -m "feat: add shared AuthLayout hero+panel component"
```

---

## Task 4: Update root _layout.tsx — font loading + remove auth gate

**Files:**
- Modify: `app/_layout.tsx`

The root layout loads the Cormorant Garamond font so it is available app-wide. The auth-gate redirect `useEffect` is removed. The auth listener is kept to populate session/profile state for the TopBar.

No Jest test — layout wiring.

- [ ] **Step 4.1: Rewrite app/_layout.tsx**

Replace the entire file with:

```tsx
import React, { useEffect, useState } from 'react'
import { Slot } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  useFonts,
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
} from '@expo-google-fonts/cormorant-garamond'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function RootLayout() {
  const [initialized, setInitialized] = useState(false)
  const { setSession, setProfile, clear } = useAuthStore()

  useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
  })

  useEffect(() => {
    const fallback = setTimeout(() => setInitialized(true), 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        clearTimeout(fallback)
        setSession(newSession)

        if (newSession) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single()
          setProfile(data as Profile | null)
        } else {
          clear()
        }

        setInitialized(true)
      }
    )

    return () => {
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [setSession, setProfile, clear])

  // Don't render until we know auth state — prevents flash of guest UI for logged-in users
  if (!initialized) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
```

> **What changed vs before:**
> - Removed `useRouter`, `useSegments` — no more redirect logic
> - Removed the navigation `useEffect` that redirected to `/auth/login`
> - Added `useFonts` for Cormorant Garamond (Light + Light Italic)
> - Added `if (!initialized) return null` — replaces the splash screen hold; renders nothing until Supabase resolves
> - Auth listener remains to populate store for TopBar

- [ ] **Step 4.2: Run full test suite**

```bash
cd D:/Projects/embers-mobile && npm test
```

Expected: All tests PASS. (No tests cover _layout.tsx directly.)

- [ ] **Step 4.3: Commit**

```bash
cd D:/Projects/embers-mobile
git add app/_layout.tsx
git commit -m "feat: add font loading to root layout, remove auth gate redirect"
```

---

## Task 5: Rewrite welcome screen (app/index.tsx)

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 5.1: Rewrite app/index.tsx**

```tsx
import React, { useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/authStore'

export default function WelcomeScreen() {
  const router = useRouter()
  const { session, profile } = useAuthStore()

  // Skip welcome screen for authenticated users who have completed setup
  useEffect(() => {
    if (session && profile?.username) {
      router.replace('/(drawer)/map')
    }
  }, [session, profile])

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Embers</Text>
      <Text style={styles.tagline}>where you can light your thoughts</Text>
      <TouchableOpacity
        style={styles.goButton}
        onPress={() => router.replace('/(drawer)/map')}
        activeOpacity={0.7}
      >
        <Text style={styles.goText}>GO</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  goButton: {
    marginTop: 48,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  goText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 2,
  },
})
```

- [ ] **Step 5.2: Commit**

```bash
cd D:/Projects/embers-mobile
git add app/index.tsx
git commit -m "feat: add welcome screen with GO button and auth bypass"
```

---

## Task 6: Rename (tabs) → (drawer) and create drawer layout

**Files:**
- Rename: `app/(tabs)/` → `app/(drawer)/`
- Create: `app/(drawer)/_layout.tsx`
- Create: `components/navigation/DrawerContent.tsx`
- Create: `components/navigation/TopBar.tsx`

No Jest test for navigation layout or visual components.

- [ ] **Step 6.1: Move screen files to new directory**

```bash
cd D:/Projects/embers-mobile

# Create new group directory
mkdir -p "app/(drawer)/profile"

# Move screens (not the layout — it will be replaced)
cp "app/(tabs)/map.tsx" "app/(drawer)/map.tsx"
cp "app/(tabs)/feed.tsx" "app/(drawer)/feed.tsx"
cp "app/(tabs)/notifications.tsx" "app/(drawer)/notifications.tsx"
cp "app/(tabs)/profile/index.tsx" "app/(drawer)/profile/index.tsx"
cp "app/(tabs)/profile/settings.tsx" "app/(drawer)/profile/settings.tsx"

# Delete old group entirely
rm -rf "app/(tabs)"
```

- [ ] **Step 6.1b: Fix stale `(tabs)` route reference in moved profile screen**

`app/(drawer)/profile/index.tsx` was copied as-is and still contains a `/(tabs)/profile/settings` route reference. Update it:

Open `app/(drawer)/profile/index.tsx`. Find every occurrence of `/(tabs)/` and replace with `/(drawer)/`. There should be exactly one: `/(tabs)/profile/settings` → `/(drawer)/profile/settings`.

Verify no `(tabs)` references remain in the drawer group:

```bash
cd D:/Projects/embers-mobile && grep -r "(tabs)" "app/(drawer)/"
```

Expected: no output.

- [ ] **Step 6.2: Create DrawerContent component**

Create `components/navigation/DrawerContent.tsx`:

```tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useNotifStore } from '@/store/notifStore'

const NAV_ITEMS = [
  { label: 'Map', route: '/(drawer)/map' },
  { label: 'Feed', route: '/(drawer)/feed' },
  { label: 'Alerts', route: '/(drawer)/notifications' },
] as const

export function DrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const router = useRouter()
  const { clear } = useAuthStore()
  const unreadCount = useNotifStore((s) => s.unreadCount)

  // Map drawer route names to our nav items
  const activeRouteName = state.routeNames[state.index]

  function getActiveLabel(): string {
    if (activeRouteName === 'map') return 'Map'
    if (activeRouteName === 'feed') return 'Feed'
    if (activeRouteName === 'notifications') return 'Alerts'
    return ''
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          clear()
          navigation.closeDrawer()
          router.replace('/')
        },
      },
    ])
  }

  const activeLabel = getActiveLabel()

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === activeLabel
          return (
            <TouchableOpacity
              key={item.label}
              style={styles.navItem}
              onPress={() => {
                router.replace(item.route)
                navigation.closeDrawer()
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, isActive && styles.dotActive]} />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
              {item.label === 'Alerts' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      <TouchableOpacity onPress={handleSignOut} activeOpacity={0.5}>
        <Text style={styles.signOut}>SIGN OUT</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    borderRightWidth: 1,
    borderRightColor: '#141414',
    paddingTop: 80,
    paddingBottom: 40,
  },
  nav: {
    flex: 1,
    paddingHorizontal: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: '#ffffff',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#3a3a4a',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  navLabelActive: {
    fontWeight: '600',
    color: '#ffffff',
  },
  badge: {
    marginLeft: 'auto',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '600',
  },
  signOut: {
    fontSize: 10,
    color: '#252525',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
  },
})
```

- [ ] **Step 6.3: Create TopBar component**

Create `components/navigation/TopBar.tsx`:

```tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useNavigationState } from '@react-navigation/native'
import { DrawerNavigationProp } from '@react-navigation/drawer'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/authStore'

export function TopBar() {
  const navigation = useNavigation<DrawerNavigationProp<Record<string, undefined>>>()
  const router = useRouter()
  const { session, profile } = useAuthStore()

  // Track drawer open/closed state
  const drawerStatus = useNavigationState((state) => {
    // expo-router drawer sets history entries when open
    return state?.history?.some((h: { type: string }) => h.type === 'drawer') ?? false
  })

  const isDrawerOpen = drawerStatus

  function toggleDrawer() {
    if (isDrawerOpen) {
      navigation.closeDrawer()
    } else {
      navigation.openDrawer()
    }
  }

  function handleProfilePress() {
    if (session) {
      router.push('/(drawer)/profile')
    } else {
      router.push('/auth/login')
    }
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Hamburger / Close */}
      <TouchableOpacity style={styles.hamburger} onPress={toggleDrawer} activeOpacity={0.8}>
        {isDrawerOpen ? (
          <Text style={styles.closeIcon}>✕</Text>
        ) : (
          <View style={styles.lines}>
            <View style={styles.line} />
            <View style={styles.line} />
            <View style={styles.line} />
          </View>
        )}
      </TouchableOpacity>

      {/* Profile pill */}
      <TouchableOpacity style={styles.profilePill} onPress={handleProfilePress} activeOpacity={0.8}>
        {/* Avatar circle */}
        <View style={styles.avatar}>
          {!session && <Text style={styles.guestIcon}>👤</Text>}
        </View>
        <Text style={[styles.profileLabel, !session && styles.guestLabel]}>
          {session && profile?.username ? `@${profile.username}` : 'Sign in'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52, // below status bar
    paddingBottom: 8,
    zIndex: 100,
  },
  hamburger: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lines: {
    gap: 4,
    alignItems: 'center',
  },
  line: {
    width: 13,
    height: 1,
    backgroundColor: '#aaaaaa',
  },
  closeIcon: {
    fontSize: 14,
    color: '#aaaaaa',
    lineHeight: 16,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
    paddingLeft: 5,
    paddingRight: 10,
    paddingVertical: 5,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestIcon: {
    fontSize: 11,
  },
  profileLabel: {
    fontSize: 11,
    color: '#aaaaaa',
    letterSpacing: 0.5,
  },
  guestLabel: {
    color: '#3a3a4a',
  },
})
```

- [ ] **Step 6.4: Create drawer layout**

Create `app/(drawer)/_layout.tsx`:

```tsx
import React from 'react'
import { View } from 'react-native'
import { Drawer } from 'expo-router/drawer'
import { DrawerContent } from '@/components/navigation/DrawerContent'
import { TopBar } from '@/components/navigation/TopBar'

export default function DrawerLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          overlayColor: 'rgba(0,0,0,0.5)',
          drawerStyle: {
            width: '65%',
            backgroundColor: '#080808',
          },
        }}
      >
        <Drawer.Screen name="map" />
        <Drawer.Screen name="feed" />
        <Drawer.Screen name="notifications" />
        <Drawer.Screen name="profile" />
      </Drawer>
      {/* TopBar overlays all drawer screens */}
      <TopBar />
    </View>
  )
}
```

- [ ] **Step 6.5: Run full test suite**

```bash
cd D:/Projects/embers-mobile && npm test
```

Expected: All tests PASS.

- [ ] **Step 6.6: Commit**

```bash
cd D:/Projects/embers-mobile
git add "app/(drawer)/" components/navigation/
git commit -m "feat: replace tab navigator with sidebar drawer, add TopBar and DrawerContent"
```

---

## Task 7: Rewrite auth screens with new layout

**Files:**
- Modify: `app/auth/login.tsx`
- Modify: `app/auth/signup.tsx`
- Modify: `app/auth/setup-username.tsx`
- Create: `app/auth/forgot-password.tsx`

No Jest tests — pure screen rewrites using existing logic, new visual layout.

- [ ] **Step 7.1: Rewrite login.tsx**

Replace entire `app/auth/login.tsx` with:

```tsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
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
    color: '#e94560',
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
    color: '#e94560',
  },
})
```

- [ ] **Step 7.2: Rewrite signup.tsx**

Replace entire `app/auth/signup.tsx` with:

```tsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function SignupScreen() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({})

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
    setLoading(true)
    const { error } = await signUp(email.trim(), password)
    setLoading(false)
    if (error) {
      Alert.alert('Signup failed', error)
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
      <Button label="Create account" onPress={handleSignUp} loading={loading} style={styles.button} />
      <TouchableOpacity onPress={() => router.back()} style={styles.switchLink}>
        <Text style={styles.switchText}>
          Already have an account?{' '}
          <Text style={styles.switchAction}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  button: { marginTop: 8 },
  switchLink: { alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 11, color: '#3a3a4a' },
  switchAction: { color: '#e94560' },
})
```

- [ ] **Step 7.3: Rewrite setup-username.tsx**

Replace entire `app/auth/setup-username.tsx` with:

```tsx
import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH, USERNAME_REGEX } from '@/constants/validation'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function SetupUsernameScreen() {
  const { session, setProfile } = useAuthStore()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(): boolean {
    if (!username.trim()) { setError('Username is required'); return false }
    if (username.length < MIN_USERNAME_LENGTH) { setError(`At least ${MIN_USERNAME_LENGTH} characters`); return false }
    if (username.length > MAX_USERNAME_LENGTH) { setError(`Max ${MAX_USERNAME_LENGTH} characters`); return false }
    if (!USERNAME_REGEX.test(username)) { setError('Letters, numbers, underscores and periods only'); return false }
    if (username.startsWith('.') || username.endsWith('.')) { setError('Cannot start or end with a period'); return false }
    if (username.includes('..')) { setError('Cannot contain consecutive periods'); return false }
    setError(null)
    return true
  }

  async function handleSave() {
    if (!validate() || !session) return
    setLoading(true)

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle()

    if (existing) {
      setError('This username is already taken')
      setLoading(false)
      return
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', session.user.id)
      .select()
      .single()

    setLoading(false)

    if (updateError || !updatedProfile) {
      Alert.alert('Error', updateError?.message ?? 'Failed to update profile')
      return
    }

    setProfile(updatedProfile as Profile)
  }

  return (
    <AuthLayout>
      <Text style={styles.heading}>Choose your username</Text>
      <Text style={styles.subtext}>How others will see you on the map</Text>
      <Input
        label="Username"
        value={username}
        onChangeText={(text) => { setUsername(text); setError(null) }}
        autoCapitalize="none"
        autoCorrect={false}
        error={error ?? undefined}
        placeholder="e.g. jayrb"
      />
      <Button label="Save username" onPress={handleSave} loading={loading} style={styles.button} />
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 15, fontWeight: '600', color: '#ffffff', marginBottom: 4 },
  subtext: { fontSize: 12, color: '#3a3a4a', marginBottom: 16 },
  button: { marginTop: 8 },
})
```

- [ ] **Step 7.4: Create forgot-password.tsx**

Create `app/auth/forgot-password.tsx`:

```tsx
import React, { useState } from 'react'
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  async function handleSend() {
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    setLoading(true)
    const { error: resetError } = await resetPassword(email.trim())
    setLoading(false)
    if (resetError) {
      setError(resetError)
    } else {
      Alert.alert('Check your email', 'A password reset link has been sent to ' + email.trim(), [
        { text: 'OK', onPress: () => router.back() },
      ])
    }
  }

  return (
    <AuthLayout>
      <Text style={styles.heading}>Reset password</Text>
      <Text style={styles.subtext}>Enter your email and we'll send a reset link</Text>
      <Input
        label="Email"
        value={email}
        onChangeText={(text) => { setEmail(text); setError(undefined) }}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        error={error}
      />
      <Button label="Send reset link" onPress={handleSend} loading={loading} style={styles.button} />
      <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backText}>Back to sign in</Text>
      </TouchableOpacity>
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 15, fontWeight: '600', color: '#ffffff', marginBottom: 4 },
  subtext: { fontSize: 12, color: '#3a3a4a', marginBottom: 16 },
  button: { marginTop: 8 },
  backLink: { alignItems: 'center', marginTop: 20 },
  backText: { fontSize: 11, color: '#3a3a4a' },
})
```

- [ ] **Step 7.5: Add forgot-password screen to auth layout**

Open `app/auth/_layout.tsx`. Add `forgot-password` as a `Stack.Screen`:

```tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#080808' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="setup-username" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  )
}
```

- [ ] **Step 7.6: Run full test suite**

```bash
cd D:/Projects/embers-mobile && npm test
```

Expected: All tests PASS.

- [ ] **Step 7.7: Commit**

```bash
cd D:/Projects/embers-mobile
git add app/auth/
git commit -m "feat: rewrite auth screens with AuthLayout, add forgot password screen"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
cd D:/Projects/embers-mobile && npm test
```

Expected: All tests PASS, 0 failures.

- [ ] **Search for any remaining (tabs) references**

```bash
cd D:/Projects/embers-mobile && grep -r "(tabs)" app/ components/ hooks/ store/ --include="*.ts" --include="*.tsx"
```

Expected: No output — all `(tabs)` references replaced with `(drawer)`.

- [ ] **Manual smoke test**

```bash
cd D:/Projects/embers-mobile && npx expo start --clear
```

Verify:
- Welcome screen shows with serif "Embers", tagline, GO button
- GO button → map screen (no auth required)
- Hamburger opens sidebar with Map / Feed / Alerts items
- Profile pill top-right shows "Sign in" for guest, `@username` for logged-in user
- Tapping profile pill as guest → login screen
- Login screen: new layout with logo top, form panel bottom, forgot password link
- Forgot password screen works (sends email via Supabase)
- Signup screen: same layout
- After auth: welcome screen skipped, goes straight to map
