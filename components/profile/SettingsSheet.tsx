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
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // sync toggle with profile
  useEffect(() => {
    setEmbersHidden(profile?.embers_hidden ?? false)
  }, [profile?.embers_hidden])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

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
      setUsernameError('3\u201320 chars, letters, numbers and underscores only')
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
    successTimerRef.current = setTimeout(() => {
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
