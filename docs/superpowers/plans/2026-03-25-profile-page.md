# Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authenticated user's profile page with a hero header, tabbed ember list, and a settings bottom sheet.

**Architecture:** Four focused files — two card components, one settings sheet, one main screen. Data comes from Supabase queries (embers/blue_embers) + the Zustand auth store (profile). The settings sheet handles username change inline, password reset fire-and-forget, embers_hidden toggle, and sign out.

**Tech Stack:** React Native / Expo / TypeScript, Supabase JS client, React Query (useQuery / useMutation), Zustand (authStore), react-native-svg, @testing-library/react-native (Jest)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/profile/EmberCard.tsx` | Create | Orange ember card — type badge, age, relight count, thought |
| `components/profile/BlueEmberCard.tsx` | Create | Blue ember card — title, audio duration, age, relight count |
| `components/profile/SettingsSheet.tsx` | Create | Modal bottom sheet — username, password, toggle, sign out |
| `app/(tabs)/profile.tsx` | Replace stub | Main screen — hero header, tabs, lists, wires everything together |
| `__tests__/components/profile/EmberCard.test.tsx` | Create | Unit tests for EmberCard |
| `__tests__/components/profile/BlueEmberCard.test.tsx` | Create | Unit tests for BlueEmberCard |
| `__tests__/components/profile/SettingsSheet.test.tsx` | Create | Unit tests for SettingsSheet |

---

## Task 1: EmberCard component

**Files:**
- Create: `components/profile/EmberCard.tsx`
- Create: `__tests__/components/profile/EmberCard.test.tsx`

- [ ] **Step 1.1: Write the failing tests**

Create `__tests__/components/profile/EmberCard.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { EmberCard } from '@/components/profile/EmberCard'

const base = {
  id: 'e1',
  thought: 'Sometimes I wonder if silence is the loudest answer.',
  ember_type: 'thought',
  created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  relight_count: 7,
}

describe('EmberCard', () => {
  it('renders the thought text', () => {
    const { getByText } = render(<EmberCard ember={base} />)
    expect(getByText(base.thought)).toBeTruthy()
  })

  it('renders the ember type label', () => {
    const { getByText } = render(<EmberCard ember={base} />)
    expect(getByText(/thought/i)).toBeTruthy()
  })

  it('renders the relight count', () => {
    const { getByText } = render(<EmberCard ember={base} />)
    expect(getByText(/7/)).toBeTruthy()
  })

  it('renders without crashing when ember_type is null', () => {
    const { getByText } = render(<EmberCard ember={{ ...base, ember_type: null }} />)
    expect(getByText(base.thought)).toBeTruthy()
  })
})
```

- [ ] **Step 1.2: Run tests — expect FAIL**

```bash
npx jest __tests__/components/profile/EmberCard.test.tsx --no-coverage
```

Expected: `Cannot find module '@/components/profile/EmberCard'`

- [ ] **Step 1.3: Create EmberCard component**

Create `components/profile/EmberCard.tsx`:

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { timeAgo } from '@/lib/emberUtils'

export type ProfileEmber = {
  id: string
  thought: string
  ember_type: string | null
  created_at: string
  relight_count: number
}

const TYPE_LABELS: Record<string, string> = {
  thought: 'Thought',
  confession: 'Confession',
  secret: 'Secret',
  question: 'Question',
  memory: 'Memory',
  dream: 'Dream',
  rant: 'Rant',
  gratitude: 'Gratitude',
}

const TYPE_COLOR = 'rgba(255,170,60,0.85)'

function TypeIcon({ type, size = 12 }: { type: string; size?: number }) {
  switch (type) {
    case 'thought':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
        </Svg>
      )
    case 'confession':
    case 'secret':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </Svg>
      )
    case 'dream':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
        </Svg>
      )
    case 'rant':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        </Svg>
      )
    case 'gratitude':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </Svg>
      )
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </Svg>
      )
  }
}

export function EmberCard({ ember }: { ember: ProfileEmber }) {
  const label = ember.ember_type ? (TYPE_LABELS[ember.ember_type] ?? ember.ember_type) : 'Ember'

  return (
    <View style={styles.card}>
      <View style={styles.meta}>
        <View style={styles.typeBadge}>
          <TypeIcon type={ember.ember_type ?? 'question'} size={11} />
          <Text style={styles.typeLabel}>{label.toUpperCase()}</Text>
        </View>
        <Text style={styles.age}>
          {timeAgo(ember.created_at)}{ember.relight_count > 0 ? ` · ${ember.relight_count} relights` : ''}
        </Text>
      </View>
      <Text style={styles.thought} numberOfLines={4}>{ember.thought}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    padding: 12,
    gap: 7,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  typeLabel: {
    fontSize: 9,
    color: 'rgba(255,170,60,0.85)',
    letterSpacing: 0.6,
  },
  age: {
    fontSize: 9,
    color: '#3a3a4a',
  },
  thought: {
    fontSize: 12,
    color: '#bbbbbb',
    lineHeight: 18.6,
  },
})
```

- [ ] **Step 1.4: Run tests — expect PASS**

```bash
npx jest __tests__/components/profile/EmberCard.test.tsx --no-coverage
```

Expected: 4 tests pass

- [ ] **Step 1.5: Commit**

```bash
git add components/profile/EmberCard.tsx __tests__/components/profile/EmberCard.test.tsx
git commit -m "feat: add EmberCard component for profile page"
```

---

## Task 2: BlueEmberCard component

**Files:**
- Create: `components/profile/BlueEmberCard.tsx`
- Create: `__tests__/components/profile/BlueEmberCard.test.tsx`

- [ ] **Step 2.1: Write the failing tests**

Create `__tests__/components/profile/BlueEmberCard.test.tsx`:

```tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { BlueEmberCard } from '@/components/profile/BlueEmberCard'

const base = {
  id: 'b1',
  title: 'A quiet evening on the rooftop',
  audio_duration: 93,
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  relight_count: 4,
}

describe('BlueEmberCard', () => {
  it('renders the title', () => {
    const { getByText } = render(<BlueEmberCard blueEmber={base} />)
    expect(getByText(base.title)).toBeTruthy()
  })

  it('formats audio_duration as m:ss', () => {
    const { getByText } = render(<BlueEmberCard blueEmber={base} />)
    expect(getByText('1:33')).toBeTruthy()
  })

  it('formats sub-minute duration as 0:ss', () => {
    const { getByText } = render(<BlueEmberCard blueEmber={{ ...base, audio_duration: 45 }} />)
    expect(getByText('0:45')).toBeTruthy()
  })

  it('renders the relight count', () => {
    const { getByText } = render(<BlueEmberCard blueEmber={base} />)
    expect(getByText(/4 relights/)).toBeTruthy()
  })
})
```

- [ ] **Step 2.2: Run tests — expect FAIL**

```bash
npx jest __tests__/components/profile/BlueEmberCard.test.tsx --no-coverage
```

Expected: `Cannot find module '@/components/profile/BlueEmberCard'`

- [ ] **Step 2.3: Create BlueEmberCard component**

Create `components/profile/BlueEmberCard.tsx`:

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { timeAgo } from '@/lib/emberUtils'

export type ProfileBlueEmber = {
  id: string
  title: string
  audio_duration: number
  created_at: string
  relight_count: number
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function BlueEmberCard({ blueEmber }: { blueEmber: ProfileBlueEmber }) {
  return (
    <View style={styles.card}>
      <View style={styles.meta}>
        <View style={styles.badge}>
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.85)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </Svg>
          <Text style={styles.badgeText}>BLUE EMBER</Text>
        </View>
        <Text style={styles.duration}>{formatDuration(blueEmber.audio_duration)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{blueEmber.title}</Text>
      <Text style={styles.age}>
        {timeAgo(blueEmber.created_at)}{blueEmber.relight_count > 0 ? ` · ${blueEmber.relight_count} relights` : ''}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0f1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a2030',
    padding: 12,
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontSize: 9,
    color: 'rgba(96,165,250,0.85)',
    letterSpacing: 0.6,
  },
  duration: {
    fontSize: 9,
    color: '#3b82f6',
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 13,
    color: '#93c5fd',
    lineHeight: 19,
  },
  age: {
    fontSize: 9,
    color: '#3a3a4a',
  },
})
```

- [ ] **Step 2.4: Run tests — expect PASS**

```bash
npx jest __tests__/components/profile/BlueEmberCard.test.tsx --no-coverage
```

Expected: 4 tests pass

- [ ] **Step 2.5: Commit**

```bash
git add components/profile/BlueEmberCard.tsx __tests__/components/profile/BlueEmberCard.test.tsx
git commit -m "feat: add BlueEmberCard component for profile page"
```

---

## Task 3: SettingsSheet component

**Files:**
- Create: `components/profile/SettingsSheet.tsx`
- Create: `__tests__/components/profile/SettingsSheet.test.tsx`

The sheet uses a React Native `Modal` with `animationType="slide"`. It handles four actions: username change (inline expand), password reset (fire-and-forget), embers_hidden toggle (optimistic), and sign out.

A simple toast helper is included inline — a temporary `Animated.View` overlay that shows for 2 seconds.

- [ ] **Step 3.1: Write the failing tests**

Create `__tests__/components/profile/SettingsSheet.test.tsx`:

```tsx
import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { SettingsSheet } from '@/components/profile/SettingsSheet'

// Mock supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}))

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: jest.fn() }),
}))

// Mock useAuthStore
const mockSetProfile = jest.fn()
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn((selector) =>
    selector({
      session: { user: { id: 'user-1', email: 'test@example.com' } },
      profile: { id: 'user-1', username: 'testuser', embers_hidden: false },
      setProfile: mockSetProfile,
    })
  ),
}))

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
}

describe('SettingsSheet', () => {
  it('renders all setting rows', () => {
    const { getByText } = render(<SettingsSheet {...defaultProps} />)
    expect(getByText('Change username')).toBeTruthy()
    expect(getByText('Change password')).toBeTruthy()
    expect(getByText('Hide my embers from map')).toBeTruthy()
    expect(getByText('Sign out')).toBeTruthy()
  })

  it('expands username input when "Change username" is pressed', () => {
    const { getByText, getByPlaceholderText } = render(<SettingsSheet {...defaultProps} />)
    fireEvent.press(getByText('Change username'))
    expect(getByPlaceholderText('new username')).toBeTruthy()
  })

  it('shows validation error for too-short username', async () => {
    const { getByText, getByPlaceholderText } = render(<SettingsSheet {...defaultProps} />)
    fireEvent.press(getByText('Change username'))
    fireEvent.changeText(getByPlaceholderText('new username'), 'ab')
    fireEvent.press(getByText('Save'))
    await waitFor(() => {
      expect(getByText(/3.20 chars/i)).toBeTruthy()
    })
  })

  it('calls onClose when sign out is pressed', async () => {
    const onClose = jest.fn()
    const { getByText } = render(<SettingsSheet visible={true} onClose={onClose} />)
    await act(async () => { fireEvent.press(getByText('Sign out')) })
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3.2: Run tests — expect FAIL**

```bash
npx jest __tests__/components/profile/SettingsSheet.test.tsx --no-coverage
```

Expected: `Cannot find module '@/components/profile/SettingsSheet'`

- [ ] **Step 3.3: Create SettingsSheet component**

Create `components/profile/SettingsSheet.tsx`:

```tsx
import React, { useState, useRef, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

interface Props {
  visible: boolean
  onClose: () => void
}

export function SettingsSheet({ visible, onClose }: Props) {
  const { signOut } = useAuth()
  const { session, profile, setProfile } = useAuthStore((s) => ({
    session: s.session,
    profile: s.profile,
    setProfile: s.setProfile,
  }))

  const [usernameOpen, setUsernameOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [usernameError, setUsernameError] = useState('')

  const [embersHidden, setEmbersHidden] = useState(profile?.embers_hidden ?? false)

  const toastAnim = useRef(new Animated.Value(0)).current
  const [toastMsg, setToastMsg] = useState('')

  // sync toggle with profile
  useEffect(() => {
    setEmbersHidden(profile?.embers_hidden ?? false)
  }, [profile?.embers_hidden])

  function showToast(msg: string) {
    setToastMsg(msg)
    toastAnim.setValue(1)
    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start()
  }

  async function handleSaveUsername() {
    const trimmed = newUsername.trim()
    if (!USERNAME_REGEX.test(trimmed)) {
      setUsernameError('3–20 chars, letters, numbers and underscores only')
      return
    }
    setUsernameError('')
    setUsernameStatus('saving')
    const { error } = await supabase
      .from('profiles')
      .update({ username: trimmed })
      .eq('id', session!.user.id)
    if (error) {
      if ((error as any).code === '23505') {
        setUsernameError('username already taken')
      } else {
        setUsernameError('something went wrong, try again')
      }
      setUsernameStatus('error')
      return
    }
    setProfile({ ...profile!, username: trimmed })
    setUsernameStatus('success')
    setTimeout(() => {
      setUsernameOpen(false)
      setNewUsername('')
      setUsernameStatus('idle')
    }, 1500)
  }

  async function handlePasswordReset() {
    if (!session?.user.email) return
    await supabase.auth.resetPasswordForEmail(session.user.email)
    showToast('Password reset email sent')
  }

  async function handleToggleHidden(value: boolean) {
    const prev = embersHidden
    setEmbersHidden(value)
    const { error } = await supabase
      .from('profiles')
      .update({ embers_hidden: value })
      .eq('id', session!.user.id)
    if (error) {
      setEmbersHidden(prev)
      showToast("couldn't save setting")
      return
    }
    setProfile({ ...profile!, embers_hidden: value })
  }

  async function handleSignOut() {
    try {
      await signOut()
    } catch {
      showToast('sign out failed, try again')
      return
    }
    onClose()
  }

  function handleClose() {
    setUsernameOpen(false)
    setNewUsername('')
    setUsernameStatus('idle')
    setUsernameError('')
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Settings</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Change username */}
            <View style={styles.group}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => { setUsernameOpen(v => !v); setUsernameError(''); setUsernameStatus('idle') }}
                activeOpacity={0.7}
              >
                <Text style={styles.rowLabel}>Change username</Text>
                <Text style={styles.chevron}>{usernameOpen ? '⌃' : '›'}</Text>
              </TouchableOpacity>

              {usernameOpen && (
                <View style={styles.usernameForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="new username"
                    placeholderTextColor="#444"
                    value={newUsername}
                    onChangeText={(t) => { setNewUsername(t); setUsernameError('') }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                  />
                  {usernameError ? (
                    <Text style={styles.inputError}>{usernameError}</Text>
                  ) : usernameStatus === 'success' ? (
                    <Text style={styles.inputSuccess}>username updated</Text>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.saveBtn, usernameStatus === 'saving' && { opacity: 0.5 }]}
                    onPress={handleSaveUsername}
                    disabled={usernameStatus === 'saving'}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Change password */}
              <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={handlePasswordReset} activeOpacity={0.7}>
                <Text style={styles.rowLabel}>Change password</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              {/* Toggle */}
              <View style={[styles.row, styles.rowBorder]}>
                <Text style={styles.rowLabel}>Hide my embers from map</Text>
                <Switch
                  value={embersHidden}
                  onValueChange={handleToggleHidden}
                  trackColor={{ false: '#2a2a2a', true: 'rgba(249,115,22,0.5)' }}
                  thumbColor={embersHidden ? '#f97316' : '#555'}
                />
              </View>
            </View>

            {/* Sign out */}
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Toast */}
      <Animated.View style={[styles.toast, { opacity: toastAnim }]} pointerEvents="none">
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#1e1e1e',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 14,
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  group: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    backgroundColor: '#161616',
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  rowLabel: {
    fontSize: 13,
    color: '#dddddd',
  },
  chevron: {
    fontSize: 16,
    color: '#444',
  },
  usernameForm: {
    backgroundColor: '#161616',
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    padding: 12,
    gap: 8,
  },
  input: {
    backgroundColor: '#0d0d0d',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#fff',
  },
  inputError: {
    fontSize: 11,
    color: '#f87171',
  },
  inputSuccess: {
    fontSize: 11,
    color: '#4ade80',
  },
  saveBtn: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  signOutBtn: {
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 13,
    color: '#ef4444',
  },
  toast: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  toastText: {
    fontSize: 12,
    color: '#ddd',
  },
})
```

- [ ] **Step 3.4: Run tests — expect PASS**

```bash
npx jest __tests__/components/profile/SettingsSheet.test.tsx --no-coverage
```

Expected: 4 tests pass

- [ ] **Step 3.5: Commit**

```bash
git add components/profile/SettingsSheet.tsx __tests__/components/profile/SettingsSheet.test.tsx
git commit -m "feat: add SettingsSheet component for profile page"
```

---

## Task 4: Profile screen

**Files:**
- Modify: `app/(tabs)/profile.tsx` (replace stub)

No dedicated test file — the screen is a composition of already-tested components. Verify manually.

- [ ] **Step 4.1: Replace profile.tsx stub**

Replace the entire contents of `app/(tabs)/profile.tsx`:

```tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { EmberCard, type ProfileEmber } from '@/components/profile/EmberCard'
import { BlueEmberCard, type ProfileBlueEmber } from '@/components/profile/BlueEmberCard'
import { SettingsSheet } from '@/components/profile/SettingsSheet'

type ActiveTab = 'embers' | 'blue'

function SkeletonCard() {
  const anim = React.useRef(new Animated.Value(0.4)).current
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [anim])
  return (
    <Animated.View style={[styles.skeletonCard, { opacity: anim }]} />
  )
}

export default function ProfileTab() {
  const profile = useAuthStore((s) => s.profile)
  const session = useAuthStore((s) => s.session)
  const [activeTab, setActiveTab] = useState<ActiveTab>('embers')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const embersQuery = useQuery<ProfileEmber[]>({
    queryKey: ['profileEmbers', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embers')
        .select('id, thought, ember_type, created_at, relight_count')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProfileEmber[]
    },
    enabled: !!session,
  })

  const blueEmbersQuery = useQuery<ProfileBlueEmber[]>({
    queryKey: ['profileBlueEmbers', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blue_embers')
        .select('id, title, audio_duration, created_at, relight_count')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProfileBlueEmber[]
    },
    enabled: !!session,
  })

  const emberCount = embersQuery.data?.length ?? 0
  const blueCount = blueEmbersQuery.data?.length ?? 0
  const initial = profile?.username?.charAt(0).toUpperCase() ?? '?'

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  function renderEmberList() {
    if (embersQuery.isLoading) {
      return <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
    }
    if (embersQuery.isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>couldn't load embers</Text>
          <TouchableOpacity onPress={() => embersQuery.refetch()} activeOpacity={0.7}>
            <Text style={styles.retryText}>retry</Text>
          </TouchableOpacity>
        </View>
      )
    }
    if (!embersQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.emptyText}>no embers yet</Text></View>
    }
    return embersQuery.data.map(e => <EmberCard key={e.id} ember={e} />)
  }

  function renderBlueList() {
    if (blueEmbersQuery.isLoading) {
      return <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
    }
    if (blueEmbersQuery.isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>couldn't load embers</Text>
          <TouchableOpacity onPress={() => blueEmbersQuery.refetch()} activeOpacity={0.7}>
            <Text style={styles.retryText}>retry</Text>
          </TouchableOpacity>
        </View>
      )
    }
    if (!blueEmbersQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.emptyText}>no blue embers yet</Text></View>
    }
    return blueEmbersQuery.data.map(b => <BlueEmberCard key={b.id} blueEmber={b} />)
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero header */}
        <View style={styles.hero}>
          {/* Gear button */}
          <TouchableOpacity style={styles.gearBtn} onPress={() => setSettingsOpen(true)} activeOpacity={0.7}>
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
              <Path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </Svg>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>

          <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
          {joinedDate ? <Text style={styles.joinDate}>member since {joinedDate.toLowerCase()}</Text> : null}

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{emberCount}</Text>
              <Text style={styles.statLabel}>EMBERS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{blueCount}</Text>
              <Text style={styles.statLabel}>BLUE EMBERS</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('embers')} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === 'embers' && styles.tabTextActive]}>EMBERS</Text>
            {activeTab === 'embers' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('blue')} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === 'blue' && styles.tabTextBlue]}>BLUE EMBERS</Text>
            {activeTab === 'blue' && <View style={[styles.tabUnderline, { backgroundColor: '#3b82f6' }]} />}
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.list}>
          {activeTab === 'embers' ? renderEmberList() : renderBlueList()}
        </View>
      </ScrollView>

      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    background: 'transparent',
  },
  // Radial glow done via SVG overlay is not needed in RN — use a background gradient workaround via View
  gearBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 10,
  },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
  avatarInitial: { fontSize: 28, color: '#f97316', fontWeight: '300' },
  username: { fontSize: 19, fontWeight: '700', color: '#ffffff', letterSpacing: 0.3 },
  joinDate: { fontSize: 11, color: '#444', marginTop: 3, letterSpacing: 0.3 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 16,
  },
  stat: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#f97316' },
  statLabel: { fontSize: 9, color: '#555', letterSpacing: 0.6 },
  statDivider: { width: 1, height: 28, backgroundColor: '#1e1e1e' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#181818',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  tab: { paddingVertical: 10, paddingHorizontal: 14, position: 'relative' },
  tabText: { fontSize: 10, color: '#3a3a4a', letterSpacing: 0.7 },
  tabTextActive: { color: '#f97316' },
  tabTextBlue: { color: '#3b82f6' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: '#f97316',
    borderRadius: 1,
  },
  list: { padding: 16, gap: 8, flexDirection: 'column' },
  skeletonCard: {
    height: 80,
    backgroundColor: '#111',
    borderRadius: 10,
    marginBottom: 8,
  },
  centered: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: '#3a3a4a' },
  retryText: { fontSize: 12, color: '#f97316' },
})
```

**Note on hero glow:** React Native doesn't support CSS radial gradients natively. To get the orange glow behind the header, wrap `hero` content in a `View` with a `react-native-svg` `RadialGradient` overlay (same pattern used in `EmberDetailSheet.tsx` for the background glow). This can be added as a follow-up polish pass — the screen is fully functional without it.

- [ ] **Step 4.2: Run all profile tests**

```bash
npx jest __tests__/components/profile/ --no-coverage
```

Expected: all tests pass

- [ ] **Step 4.3: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: no regressions

- [ ] **Step 4.4: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: implement profile page with hero header, tabs, and settings sheet"
```

---

## Task 5: Hero background glow

**Files:**
- Modify: `app/(tabs)/profile.tsx`

Add the subtle orange radial glow behind the hero header using react-native-svg (same approach as EmberDetailSheet.tsx).

- [ ] **Step 5.1: Add glow overlay to hero**

In `app/(tabs)/profile.tsx`, add `Svg` and related imports at the top:

```tsx
import Svg, { Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg'
```

Wrap the hero `View` children with a glow background. Add this as the **first child** inside `<View style={styles.hero}>`:

```tsx
<View style={StyleSheet.absoluteFillObject} pointerEvents="none">
  <Svg width="100%" height="100%" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
    <Defs>
      <RadialGradient id="heroGlow" cx="50%" cy="0%" r="70%">
        <Stop offset="0%" stopColor="#ff8c32" stopOpacity="0.13" />
        <Stop offset="100%" stopColor="#ff8c32" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect x="0" y="0" width="400" height="260" fill="url(#heroGlow)" />
  </Svg>
</View>
```

- [ ] **Step 5.2: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests still pass (glow is purely visual, no logic change)

- [ ] **Step 5.3: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: add orange radial glow to profile hero header"
```

---

## Done

The profile page is complete. Manual verification checklist:
- [ ] Hero header renders with avatar (image or initial), username, join date, ember/blue ember counts
- [ ] Gear icon opens settings sheet
- [ ] Embers tab shows user's orange embers with type badge, age, relight count
- [ ] Blue Embers tab shows blue embers with title, duration, age
- [ ] Loading shows 3 skeleton cards per tab
- [ ] Error state shows "couldn't load" + retry
- [ ] Empty state shows appropriate message per tab
- [ ] Settings: change username validates, saves, shows success/error inline
- [ ] Settings: change password sends email, shows toast
- [ ] Settings: hide embers toggle saves optimistically
- [ ] Settings: sign out works
- [ ] Sheet dismiss discards unsaved input
