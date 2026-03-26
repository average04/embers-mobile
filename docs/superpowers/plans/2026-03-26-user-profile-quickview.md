# User Profile Quick View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tappable username quick-view sheet (avatar, follow button, follower counts) that navigates to a full public profile screen with embers/blue-embers tabs.

**Architecture:** Five tasks in dependency order — shared constant first, then the two updated existing components, then the new UserProfileSheet, then wire it into EmberDetailSheet/map, then build the public profile screen. Each task commits independently and leaves the app in a working state.

**Tech Stack:** React Native / Expo Router / TypeScript / Supabase JS v2 / React Query v5 / Zustand

---

## File Structure

| File | Role |
|---|---|
| `components/navigation/BottomTabBar.tsx` | Export `TAB_BAR_HEIGHT = 62` constant |
| `components/profile/FollowUserRow.tsx` | Add optional `onUsernamePress` prop |
| `components/profile/FollowListSheet.tsx` | Add `targetUserId?`, `tabBarHeight?` props; `viewedUserId` query pattern |
| `components/profile/UserProfileSheet.tsx` | **New** — quick-view sheet above tab bar |
| `components/ember/EmberDetailSheet.tsx` | Accept `tabBarHeight` pass-through; tappable username |
| `app/(tabs)/map.tsx` | Pass `TAB_BAR_HEIGHT` to `EmberDetailSheet` |
| `app/user/[id].tsx` | **New** — public profile screen |
| `__tests__/components/profile/FollowUserRow.test.tsx` | Add `onUsernamePress` tests |
| `__tests__/components/profile/FollowListSheet.test.tsx` | Add `targetUserId` tests |
| `__tests__/components/profile/UserProfileSheet.test.tsx` | **New** |
| `__tests__/components/profile/UserProfileScreen.test.tsx` | **New** |

---

## Task 1: Export TAB_BAR_HEIGHT and add onUsernamePress to FollowUserRow

**Files:**
- Modify: `components/navigation/BottomTabBar.tsx:75-82`
- Modify: `components/profile/FollowUserRow.tsx`
- Modify: `__tests__/components/profile/FollowUserRow.test.tsx`

- [ ] **Step 1: Write failing tests for onUsernamePress**

Add to `__tests__/components/profile/FollowUserRow.test.tsx` inside the existing `describe` block, after the existing tests:

```tsx
  it('calls onUsernamePress with userId when username is tapped', () => {
    const onUsernamePress = jest.fn()
    const { getByText } = render(
      <FollowUserRow
        userId="u1"
        username="alice"
        isFollowing={false}
        onToggle={jest.fn()}
        onUsernamePress={onUsernamePress}
      />
    )
    fireEvent.press(getByText('@alice'))
    expect(onUsernamePress).toHaveBeenCalledWith('u1')
  })

  it('does not make username tappable when onUsernamePress is not provided', () => {
    const { getByText } = render(
      <FollowUserRow userId="u1" username="alice" isFollowing={false} onToggle={jest.fn()} />
    )
    // username text exists but is not wrapped in TouchableOpacity — pressing it should not throw
    expect(() => fireEvent.press(getByText('@alice'))).not.toThrow()
  })
```

You'll need to import `fireEvent` at the top:
```tsx
import { render, fireEvent } from '@testing-library/react-native'
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npx jest --testPathPatterns="FollowUserRow" --no-coverage --forceExit
```

Expected: 2 new tests FAIL (onUsernamePress not defined yet)

- [ ] **Step 3: Export TAB_BAR_HEIGHT from BottomTabBar**

In `components/navigation/BottomTabBar.tsx`, add before the `BottomTabBar` function:

```ts
export const TAB_BAR_HEIGHT = 62
```

The `height: 62` in `styles.bar` stays as-is — the constant documents the value, the style uses it implicitly.

- [ ] **Step 4: Add onUsernamePress to FollowUserRow**

Replace the entire `components/profile/FollowUserRow.tsx` file:

```tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  userId: string
  username: string
  isFollowing: boolean
  onToggle: (userId: string, newValue: boolean) => void
  onUsernamePress?: (userId: string) => void
}

export function FollowUserRow({ userId, username, isFollowing, onToggle, onUsernamePress }: Props) {
  const initial = username.charAt(0).toUpperCase()
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, isFollowing && styles.avatarFollowing]}>
        <Text style={[styles.avatarInitial, isFollowing && styles.avatarInitialFollowing]}>
          {initial}
        </Text>
      </View>
      {onUsernamePress ? (
        <TouchableOpacity onPress={() => onUsernamePress(userId)} activeOpacity={0.7} style={styles.usernameBtn}>
          <Text style={styles.username}>@{username}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.username}>@{username}</Text>
      )}
      <TouchableOpacity
        style={[styles.btn, isFollowing && styles.btnFollowing]}
        onPress={() => onToggle(userId, !isFollowing)}
        activeOpacity={0.7}
        accessibilityLabel={isFollowing ? `Unfollow ${username}` : `Follow ${username}`}
        accessibilityRole="button"
      >
        <Text style={[styles.btnText, isFollowing && styles.btnTextFollowing]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    borderWidth: 1.5,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarFollowing: { borderColor: '#f97316' },
  avatarInitial: { fontSize: 14, color: '#666' },
  avatarInitialFollowing: { color: '#f97316' },
  usernameBtn: { flex: 1 },
  username: { fontSize: 13, color: '#ddd' },
  btn: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  btnFollowing: { backgroundColor: '#f97316', borderColor: '#f97316' },
  btnText: { fontSize: 11, fontWeight: '600', color: '#888' },
  btnTextFollowing: { color: '#fff' },
})
```

- [ ] **Step 5: Run all tests**

```bash
npx jest --testPathPatterns="FollowUserRow" --no-coverage --forceExit
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add components/navigation/BottomTabBar.tsx components/profile/FollowUserRow.tsx __tests__/components/profile/FollowUserRow.test.tsx
git commit -m "feat: export TAB_BAR_HEIGHT and add onUsernamePress to FollowUserRow"
```

---

## Task 2: Update FollowListSheet — targetUserId, tabBarHeight, viewedUserId queries

**Files:**
- Modify: `components/profile/FollowListSheet.tsx`
- Modify: `__tests__/components/profile/FollowListSheet.test.tsx`

**Context:** `FollowListSheet` currently hardcodes `session.user.id` (stored as `userId`) in all list query keys. We need `viewedUserId = targetUserId ?? session.user.id` so the sheet can display another user's followers. The `myFollows` query always stays as `session.user.id` (it tracks who the logged-in user follows). `handleToggle` also needs updated invalidations. `onUsernamePress` is forwarded to each `FollowUserRow` but suppressed for rows where `user.id === session.user.id`.

- [ ] **Step 1: Write failing tests**

Add to `__tests__/components/profile/FollowListSheet.test.tsx` inside the `describe` block:

```tsx
  it('uses targetUserId for the followers list title when provided', async () => {
    // The title is built from `type` and `count` props, not targetUserId.
    // This test verifies that the sheet still renders correctly when targetUserId differs from session.
    setupMocks([{ id: 'other-u1', username: 'bob_fire' }])
    const { getByText } = render(
      <FollowListSheet
        visible={true}
        onClose={jest.fn()}
        type="followers"
        count={3}
        targetUserId="other-user-id"
      />,
      { wrapper: makeWrapper() }
    )
    await waitFor(() => expect(getByText('Followers · 3')).toBeTruthy())
  })

  it('accepts tabBarHeight prop without error', async () => {
    const { getByText } = render(
      <FollowListSheet {...defaultProps} tabBarHeight={62} />,
      { wrapper: makeWrapper() }
    )
    // tabBarHeight is forwarded to UserProfileSheet (wired in Task 4) — just verify sheet still renders
    await waitFor(() => expect(getByText('Followers · 5')).toBeTruthy())
  })
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npx jest --testPathPatterns="FollowListSheet" --no-coverage --forceExit
```

Expected: 2 new tests FAIL (unknown props)

- [ ] **Step 3: Update FollowListSheet**

Replace `components/profile/FollowListSheet.tsx` completely:

```tsx
import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { FollowUserRow } from './FollowUserRow'

interface Props {
  visible: boolean
  onClose: () => void
  type: 'followers' | 'following'
  count: number
  targetUserId?: string   // whose followers/following to show; defaults to own session user
  tabBarHeight?: number   // forwarded to UserProfileSheet (wired in Task 4); defaults to 0
}

type UserEntry = { id: string; username: string }

function SkeletonRow() {
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
  return <Animated.View style={[styles.skeletonRow, { opacity: anim }]} />
}

export function FollowListSheet({ visible, onClose, type, count, targetUserId, tabBarHeight = 0 }: Props) {
  const insets = useSafeAreaInsets()
  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()
  const ownUserId = session?.user.id
  const viewedUserId = targetUserId ?? ownUserId

  const listQuery = useQuery<UserEntry[]>({
    queryKey: [type === 'followers' ? 'followersList' : 'followingList', viewedUserId],
    queryFn: async () => {
      if (type === 'followers') {
        const { data: follows, error: e1 } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', viewedUserId!)
        if (e1) throw e1
        const ids = (follows ?? []).map((f: any) => f.follower_id)
        if (ids.length === 0) return []
        const { data: profiles, error: e2 } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', ids)
        if (e2) throw e2
        return (profiles ?? []) as UserEntry[]
      } else {
        const { data: follows, error: e1 } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', viewedUserId!)
        if (e1) throw e1
        const ids = (follows ?? []).map((f: any) => f.following_id)
        if (ids.length === 0) return []
        const { data: profiles, error: e2 } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', ids)
        if (e2) throw e2
        return (profiles ?? []) as UserEntry[]
      }
    },
    enabled: visible && !!viewedUserId,
    staleTime: 30_000,
  })

  const myFollowsQuery = useQuery<Set<string>>({
    queryKey: ['myFollows', ownUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', ownUserId!)
      if (error) throw error
      return new Set((data ?? []).map((r: any) => r.following_id))
    },
    enabled: visible && !!ownUserId,
    staleTime: 30_000,
  })

  const [myFollowingSet, setMyFollowingSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (myFollowsQuery.data) {
      setMyFollowingSet(new Set(myFollowsQuery.data))
    }
  }, [myFollowsQuery.data])

  async function handleToggle(targetId: string, newValue: boolean) {
    if (!ownUserId) return
    const prev = new Set(myFollowingSet)
    setMyFollowingSet(s => {
      const next = new Set(s)
      if (newValue) next.add(targetId)
      else next.delete(targetId)
      return next
    })

    let error: any
    if (newValue) {
      const res = await supabase
        .from('follows')
        .insert({ follower_id: ownUserId, following_id: targetId })
      error = res.error
    } else {
      const res = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', ownUserId)
        .eq('following_id', targetId)
      error = res.error
    }

    if (error) {
      setMyFollowingSet(prev)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['followerCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followersList', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followingList', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['myFollows', ownUserId] })
    // Also invalidate for the viewed user's lists when viewing someone else's profile
    if (viewedUserId && viewedUserId !== ownUserId) {
      queryClient.invalidateQueries({ queryKey: ['followersList', viewedUserId] })
      queryClient.invalidateQueries({ queryKey: ['followingList', viewedUserId] })
      queryClient.invalidateQueries({ queryKey: ['followerCount', viewedUserId] })
      queryClient.invalidateQueries({ queryKey: ['followingCount', viewedUserId] })
    }
  }

  const title = type === 'followers' ? `Followers · ${count}` : `Following · ${count}`
  const emptyMsg = type === 'followers' ? 'no followers yet' : 'not following anyone yet'

  function renderList() {
    if (listQuery.isLoading || myFollowsQuery.isLoading) {
      return <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
    }
    if (listQuery.isError || myFollowsQuery.isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>couldn't load</Text>
          <TouchableOpacity onPress={() => { listQuery.refetch(); myFollowsQuery.refetch() }} activeOpacity={0.7}>
            <Text style={styles.retryText}>retry</Text>
          </TouchableOpacity>
        </View>
      )
    }
    if (!listQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.emptyText}>{emptyMsg}</Text></View>
    }
    return listQuery.data.map((user, index) => (
      <React.Fragment key={user.id}>
        <FollowUserRow
          userId={user.id}
          username={user.username}
          isFollowing={myFollowingSet.has(user.id)}
          onToggle={handleToggle}
          // onUsernamePress wired in Task 4 after UserProfileSheet is created
        />
        {index < listQuery.data!.length - 1 && <View style={styles.separator} />}
      </React.Fragment>
    ))
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderList()}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111111',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#1e1e1e',
    paddingTop: 14,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    paddingHorizontal: 20,
    letterSpacing: 0.3,
  },
  skeletonRow: {
    height: 52,
    backgroundColor: '#161616',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  centered: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: '#3a3a4a' },
  retryText: { fontSize: 12, color: '#f97316' },
  separator: { height: 1, backgroundColor: '#1a1a1a', marginHorizontal: 20 },
})
```

- [ ] **Step 4: Run all FollowListSheet tests**

```bash
npx jest --testPathPatterns="FollowListSheet" --no-coverage --forceExit
```

Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/profile/FollowListSheet.tsx __tests__/components/profile/FollowListSheet.test.tsx
git commit -m "feat: add targetUserId and tabBarHeight props to FollowListSheet"
```

---

## Task 3: UserProfileSheet component

**Files:**
- Create: `components/profile/UserProfileSheet.tsx`
- Create: `__tests__/components/profile/UserProfileSheet.test.tsx`

**Context:** Bottom sheet that slides up from above the tab bar. Accepts `tabBarHeight` as a prop (from caller) and sets `bottom: tabBarHeight` on both the backdrop and the sheet. Shows avatar initial, username, follower/following counts, a follow/unfollow button, and "View full profile →". Uses optimistic follow state with rollback.

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/profile/UserProfileSheet.test.tsx`:

```tsx
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query'
import { UserProfileSheet } from '@/components/profile/UserProfileSheet'

notifyManager.setScheduler(cb => cb())

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn((selector: any) =>
    selector({ session: { user: { id: 'me' } } })
  ),
}))

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}))

const mockFrom = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

function setupMocks({ isFollowing = false }: { isFollowing?: boolean } = {}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'u1', username: 'alice_sparks', created_at: '2025-01-01', embers_hidden: false },
              error: null,
            }),
          }),
        }),
      }
    }
    // follows table
    return {
      select: jest.fn().mockReturnValue({
        // count query (head:true) returns count
        eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
        // maybeSingle for isFollowing
        maybeSingle: jest.fn().mockResolvedValue({
          data: isFollowing ? { id: 'f1' } : null,
          error: null,
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }
  })
}

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  userId: 'u1',
  username: 'alice_sparks',
  tabBarHeight: 62,
}

describe('UserProfileSheet', () => {
  beforeEach(() => {
    setupMocks()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders username after data loads', async () => {
    const { getByText } = render(<UserProfileSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('@alice_sparks')).toBeTruthy())
  })

  it('renders follower and following counts', async () => {
    const { getAllByText } = render(<UserProfileSheet {...defaultProps} />, { wrapper: makeWrapper() })
    // count queries return 5 for both; two separate Text nodes each showing '5'
    await waitFor(() => expect(getAllByText('5')).toHaveLength(2))
  })

  it('shows Follow button when not following', async () => {
    const { getByText } = render(<UserProfileSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('Follow')).toBeTruthy())
  })

  it('shows View full profile button', async () => {
    const { getByText } = render(<UserProfileSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('View full profile →')).toBeTruthy())
  })

  it('calls router.push and onClose when View full profile is pressed', async () => {
    const { router } = require('expo-router')
    const onClose = jest.fn()
    const { getByText } = render(
      <UserProfileSheet {...defaultProps} onClose={onClose} />,
      { wrapper: makeWrapper() }
    )
    await waitFor(() => expect(getByText('View full profile →')).toBeTruthy())
    fireEvent.press(getByText('View full profile →'))
    expect(router.push).toHaveBeenCalledWith('/user/u1')
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npx jest --testPathPatterns="UserProfileSheet" --no-coverage --forceExit
```

Expected: FAIL — module not found

- [ ] **Step 3: Create UserProfileSheet**

Create `components/profile/UserProfileSheet.tsx`:

```tsx
import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

interface Props {
  visible: boolean
  onClose: () => void
  userId: string
  username: string
  tabBarHeight: number
}

type UserProfile = { id: string; username: string; created_at: string; embers_hidden: boolean }

function SkeletonSheet() {
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
    <Animated.View style={{ opacity: anim }}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonText}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: '60%' }]} />
        </View>
      </View>
    </Animated.View>
  )
}

export function UserProfileSheet({ visible, onClose, userId, username, tabBarHeight }: Props) {
  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()
  const ownUserId = session?.user.id
  const enabled = visible && !!userId && !!ownUserId

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, created_at, embers_hidden')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data as UserProfile
    },
    enabled,
    staleTime: 30_000,
  })

  const followerCountQuery = useQuery<number>({
    queryKey: ['followerCount', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId)
      if (error) throw error
      return count ?? 0
    },
    enabled,
    staleTime: 30_000,
  })

  const followingCountQuery = useQuery<number>({
    queryKey: ['followingCount', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId)
      if (error) throw error
      return count ?? 0
    },
    enabled,
    staleTime: 30_000,
  })

  const isFollowingQuery = useQuery<boolean>({
    queryKey: ['isFollowing', ownUserId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', ownUserId!)
        .eq('following_id', userId)
        .maybeSingle()
      if (error) throw error
      return data !== null
    },
    enabled,
    staleTime: 30_000,
  })

  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (isFollowingQuery.data !== undefined) {
      setIsFollowing(isFollowingQuery.data)
    }
  }, [isFollowingQuery.data])

  async function handleToggleFollow() {
    if (!ownUserId) return
    const prev = isFollowing
    setIsFollowing(!isFollowing)

    let error: any
    if (!isFollowing) {
      const res = await supabase.from('follows').insert({ follower_id: ownUserId, following_id: userId })
      error = res.error
    } else {
      const res = await supabase.from('follows').delete().eq('follower_id', ownUserId).eq('following_id', userId)
      error = res.error
    }

    if (error) {
      setIsFollowing(prev)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['followerCount', userId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', userId] })
    queryClient.invalidateQueries({ queryKey: ['isFollowing', ownUserId, userId] })
    queryClient.invalidateQueries({ queryKey: ['followerCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followersList', userId] })
    queryClient.invalidateQueries({ queryKey: ['followingList', userId] })
    queryClient.invalidateQueries({ queryKey: ['myFollows', ownUserId] })
  }

  const isLoading = profileQuery.isLoading || followerCountQuery.isLoading ||
    followingCountQuery.isLoading || isFollowingQuery.isLoading
  const isError = profileQuery.isError

  const displayUsername = profileQuery.data?.username ?? username
  const initial = displayUsername.charAt(0).toUpperCase()
  const followerCount = followerCountQuery.data ?? 0
  const followingCount = followingCountQuery.data ?? 0

  function renderContent() {
    if (isLoading) return <SkeletonSheet />
    if (isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>couldn't load</Text>
        </View>
      )
    }
    return (
      <>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{displayUsername}</Text>
            <Text style={styles.counts}>
              <Text style={styles.countNum}>{followerCount}</Text>
              <Text> followers · </Text>
              <Text style={styles.countNum}>{followingCount}</Text>
              <Text> following</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={handleToggleFollow}
            activeOpacity={0.7}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.viewProfileBtn}
          onPress={() => { router.push('/user/' + userId); onClose() }}
          activeOpacity={0.7}
        >
          <Text style={styles.viewProfileText}>View full profile →</Text>
        </TouchableOpacity>
      </>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={[styles.backdrop, { bottom: tabBarHeight }]}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.sheet, { bottom: tabBarHeight }]}>
        <View style={styles.handle} />
        {renderContent()}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#111111',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#1e1e1e',
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: { fontSize: 22, color: '#f97316' },
  userInfo: { flex: 1 },
  username: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  counts: { fontSize: 11, color: '#888' },
  countNum: { color: '#ccc', fontWeight: '600' },
  followBtn: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  followBtnActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  followBtnText: { fontSize: 12, fontWeight: '600', color: '#888' },
  followBtnTextActive: { color: '#fff' },
  divider: { height: 1, backgroundColor: '#1a1a1a', marginBottom: 16 },
  viewProfileBtn: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewProfileText: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  skeletonRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  skeletonAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1e1e1e',
  },
  skeletonText: { flex: 1, gap: 8 },
  skeletonLine: { height: 12, backgroundColor: '#1e1e1e', borderRadius: 6, width: '80%' },
  centered: { alignItems: 'center', paddingVertical: 20 },
  errorText: { fontSize: 13, color: '#3a3a4a' },
})
```

- [ ] **Step 4: Run tests**

```bash
npx jest --testPathPatterns="UserProfileSheet" --no-coverage --forceExit
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/profile/UserProfileSheet.tsx __tests__/components/profile/UserProfileSheet.test.tsx
git commit -m "feat: add UserProfileSheet component"
```

---

## Task 4: Wire UserProfileSheet into EmberDetailSheet, FollowListSheet, and map.tsx

**Files:**
- Modify: `components/ember/EmberDetailSheet.tsx:139-142` (Props interface) and line 596 (username text)
- Modify: `components/profile/FollowListSheet.tsx` (add UserProfileSheet import + internal quick-view state)
- Modify: `app/(tabs)/map.tsx:267` (EmberDetailSheet usage)

**Context:** `EmberDetailSheet` is a centered-card Modal — it passes `tabBarHeight` through to `UserProfileSheet`. `FollowListSheet` now adds internal `quickViewUserId`/`quickViewUsername` state so tapping a username in the follower list opens `UserProfileSheet` directly (the `tabBarHeight` prop accepted in Task 2 is forwarded here). `ember.user_id` can be `null` — only wrap in TouchableOpacity when it's a non-empty string and not the logged-in user's own ID.

- [ ] **Step 1: Wire UserProfileSheet into FollowListSheet**

In `components/profile/FollowListSheet.tsx`:

**Add import** at the top (after existing imports):
```tsx
import { UserProfileSheet } from './UserProfileSheet'
```

**Add state** inside the function body, after the `myFollowingSet` state:
```tsx
  const [quickViewUserId, setQuickViewUserId] = useState<string | null>(null)
  const [quickViewUsername, setQuickViewUsername] = useState('')
```

**Replace the comment placeholder** in `renderList`:
```tsx
          // onUsernamePress wired in Task 4 after UserProfileSheet is created
```
with:
```tsx
          onUsernamePress={user.id !== ownUserId ? (id) => {
            setQuickViewUserId(id)
            setQuickViewUsername(user.username)
          } : undefined}
```

**Add UserProfileSheet render** — add just before the closing `</Modal>` tag in the return:
```tsx
      {quickViewUserId && (
        <UserProfileSheet
          visible={!!quickViewUserId}
          onClose={() => setQuickViewUserId(null)}
          userId={quickViewUserId}
          username={quickViewUsername}
          tabBarHeight={tabBarHeight ?? 0}
        />
      )}
```

- [ ] **Step 2: Add tabBarHeight to EmberDetailSheet Props and wire username tap**

In `components/ember/EmberDetailSheet.tsx`:

**Change the Props interface** (around line 139):
```tsx
interface Props {
  ember: MapEmber
  onDismiss: () => void
  tabBarHeight: number
}
```

**Change the function signature** (line 153):
```tsx
export function EmberDetailSheet({ ember, onDismiss, tabBarHeight }: Props) {
```

**Add state for user profile sheet** — add these two lines immediately after the existing `useState` declarations at the top of the function body (around line 157, after `const [playing, setPlaying] = useState(hasTiktok)`):
```tsx
  const [userProfileVisible, setUserProfileVisible] = useState(false)
```

**Add the import** at the top of the file, after the existing imports:
```tsx
import { UserProfileSheet } from '@/components/profile/UserProfileSheet'
```

**Replace the username text** (line 596):

Find this line:
```tsx
              <Text style={styles.username}>— {ember.username ?? 'unknown'}</Text>
```

Replace with:
```tsx
              {ember.user_id && ember.user_id !== session?.user.id ? (
                <TouchableOpacity onPress={() => setUserProfileVisible(true)} activeOpacity={0.7}>
                  <Text style={styles.username}>— {ember.username ?? 'unknown'}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.username}>— {ember.username ?? 'unknown'}</Text>
              )}
```

**Add UserProfileSheet to the JSX** — at the end of the returned JSX, just before the closing `</Modal>` tag (the outer Modal of EmberDetailSheet). Find the last `</Modal>` in the component return and add just before it:

```tsx
        {ember.user_id && ember.user_id !== session?.user.id && (
          <UserProfileSheet
            visible={userProfileVisible}
            onClose={() => setUserProfileVisible(false)}
            userId={ember.user_id}
            username={ember.username ?? ''}
            tabBarHeight={tabBarHeight}
          />
        )}
```

- [ ] **Step 3: Pass TAB_BAR_HEIGHT in map.tsx**

In `app/(tabs)/map.tsx`:

Add import at the top:
```tsx
import { TAB_BAR_HEIGHT } from '@/components/navigation/BottomTabBar'
```

Find this line (around line 267):
```tsx
        <EmberDetailSheet ember={selectedEmber} onDismiss={handleDismiss} />
```

Replace with:
```tsx
        <EmberDetailSheet ember={selectedEmber} onDismiss={handleDismiss} tabBarHeight={TAB_BAR_HEIGHT} />
```

- [ ] **Step 4: Run all tests to ensure nothing broke**

```bash
npx jest --no-coverage --forceExit
```

Expected: all tests PASS (EmberDetailSheet has no dedicated tests in the suite)

- [ ] **Step 5: Commit**

```bash
git add components/profile/FollowListSheet.tsx components/ember/EmberDetailSheet.tsx "app/(tabs)/map.tsx"
git commit -m "feat: wire UserProfileSheet into FollowListSheet, EmberDetailSheet, and map"
```

---

## Task 5: Public profile screen

**Files:**
- Create: `app/user/[id].tsx`
- Create: `__tests__/components/profile/UserProfileScreen.test.tsx`

**Context:** Dynamic Expo Router screen at `/user/[id]`. Uses `useLocalSearchParams` to get `id`. No `_layout.tsx` needed — the root layout wraps it as a stack screen. Back navigation via `router.back()`. Reuses `EmberCard`, `BlueEmberCard`, `FollowListSheet` components. Shows "this user's embers are private" when `embers_hidden === true`. Hides follow button for own profile.

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/profile/UserProfileScreen.test.tsx`:

```tsx
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query'
import UserProfileScreen from '@/app/user/[id]'

notifyManager.setScheduler(cb => cb())

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'target-user-id' }),
  router: { back: jest.fn(), push: jest.fn() },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn((selector: any) =>
    selector({ session: { user: { id: 'me' } }, profile: null })
  ),
}))

jest.mock('@/components/navigation/BottomTabBar', () => ({
  TAB_BAR_HEIGHT: 62,
}))

const mockFrom = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

function setupMocks({ embersHidden = false }: { embersHidden?: boolean } = {}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'target-user-id',
                username: 'mika_void',
                created_at: '2025-01-15T00:00:00Z',
                embers_hidden: embersHidden,
              },
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'embers') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{ id: 'e1', thought: 'hello world', ember_type: 'thought', created_at: '2025-01-15T00:00:00Z', relight_count: 0 }],
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'blue_embers') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }
    }
    // follows table
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ count: 10, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }
  })
}

describe('UserProfileScreen', () => {
  beforeEach(() => setupMocks())
  afterEach(() => jest.clearAllMocks())

  it('renders username after profile loads', async () => {
    const { getByText } = render(<UserProfileScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('@mika_void')).toBeTruthy())
  })

  it('shows embers when embers_hidden is false', async () => {
    const { getByText } = render(<UserProfileScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('hello world')).toBeTruthy())
  })

  it('shows private message when embers_hidden is true', async () => {
    setupMocks({ embersHidden: true })
    const { getByText } = render(<UserProfileScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText("this user's embers are private")).toBeTruthy())
  })
})
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npx jest --testPathPatterns="UserProfileScreen" --no-coverage --forceExit

```

Expected: FAIL — module not found

- [ ] **Step 3: Create the user directory and screen**

Create `app/user/[id].tsx`:

```tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { EmberCard, type ProfileEmber } from '@/components/profile/EmberCard'
import { BlueEmberCard, type ProfileBlueEmber } from '@/components/profile/BlueEmberCard'
import { FollowListSheet } from '@/components/profile/FollowListSheet'
import { TAB_BAR_HEIGHT } from '@/components/navigation/BottomTabBar'

type UserProfile = { id: string; username: string; created_at: string; embers_hidden: boolean }
type ActiveTab = 'embers' | 'blue'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()
  const ownUserId = session?.user.id
  const userId = id as string

  const [activeTab, setActiveTab] = useState<ActiveTab>('embers')
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null)

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, created_at, embers_hidden')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data as UserProfile
    },
    enabled: !!userId && !!session,
    staleTime: 30_000,
  })

  const followerCountQuery = useQuery<number>({
    queryKey: ['followerCount', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!userId && !!session,
    staleTime: 30_000,
  })

  const followingCountQuery = useQuery<number>({
    queryKey: ['followingCount', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!userId && !!session,
    staleTime: 30_000,
  })

  const isFollowingQuery = useQuery<boolean>({
    queryKey: ['isFollowing', ownUserId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', ownUserId!)
        .eq('following_id', userId)
        .maybeSingle()
      if (error) throw error
      return data !== null
    },
    enabled: !!userId && !!session && userId !== ownUserId,
    staleTime: 30_000,
  })

  const [isFollowing, setIsFollowing] = useState(false)
  React.useEffect(() => {
    if (isFollowingQuery.data !== undefined) setIsFollowing(isFollowingQuery.data)
  }, [isFollowingQuery.data])

  const embersHidden = profileQuery.data?.embers_hidden === true

  const embersQuery = useQuery<ProfileEmber[]>({
    queryKey: ['userEmbers', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embers')
        .select('id, thought, ember_type, created_at, relight_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProfileEmber[]
    },
    enabled: !!userId && profileQuery.data?.embers_hidden === false,
    staleTime: 30_000,
  })

  const blueEmbersQuery = useQuery<ProfileBlueEmber[]>({
    queryKey: ['userBlueEmbers', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blue_embers')
        .select('id, title, audio_duration, created_at, relight_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProfileBlueEmber[]
    },
    enabled: !!userId && profileQuery.data?.embers_hidden === false,
    staleTime: 30_000,
  })

  async function handleToggleFollow() {
    if (!ownUserId || userId === ownUserId) return
    const prev = isFollowing
    setIsFollowing(!isFollowing)

    let error: any
    if (!isFollowing) {
      const res = await supabase.from('follows').insert({ follower_id: ownUserId, following_id: userId })
      error = res.error
    } else {
      const res = await supabase.from('follows').delete().eq('follower_id', ownUserId).eq('following_id', userId)
      error = res.error
    }

    if (error) {
      setIsFollowing(prev)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['followerCount', userId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', userId] })
    queryClient.invalidateQueries({ queryKey: ['isFollowing', ownUserId, userId] })
    queryClient.invalidateQueries({ queryKey: ['followerCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['myFollows', ownUserId] })
  }

  const profile = profileQuery.data
  const username = profile?.username ?? '…'
  const initial = username === '…' ? '?' : username.charAt(0).toUpperCase()
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''
  const followerCount = followerCountQuery.data ?? 0
  const followingCount = followingCountQuery.data ?? 0
  const isOwnProfile = userId === ownUserId

  function renderEmberList() {
    if (profileQuery.isError) {
      return <View style={styles.centered}><Text style={styles.mutedText}>couldn't load profile</Text></View>
    }
    if (embersHidden) {
      return <View style={styles.centered}><Text style={styles.mutedText}>this user's embers are private</Text></View>
    }
    if (embersQuery.isLoading) {
      return (
        <>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </>
      )
    }
    if (!embersQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.mutedText}>no embers yet</Text></View>
    }
    return embersQuery.data.map(e => <EmberCard key={e.id} ember={e} />)
  }

  function renderBlueList() {
    if (profileQuery.isError) {
      return <View style={styles.centered}><Text style={styles.mutedText}>couldn't load profile</Text></View>
    }
    if (embersHidden) {
      return <View style={styles.centered}><Text style={styles.mutedText}>this user's embers are private</Text></View>
    }
    if (blueEmbersQuery.isLoading) {
      return (
        <>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </>
      )
    }
    if (!blueEmbersQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.mutedText}>no blue embers yet</Text></View>
    }
    return blueEmbersQuery.data.map(b => <BlueEmberCard key={b.id} blueEmber={b} />)
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Back row */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backUsername}>@{username}</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.username}>@{username}</Text>

          {/* Followers/following counts */}
          <View style={styles.followRow}>
            <TouchableOpacity onPress={() => setFollowListType('followers')} activeOpacity={0.7}>
              <Text style={styles.followText}>
                <Text style={styles.followCount}>{followerCount}</Text>
                {' followers'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.followDot}> · </Text>
            <TouchableOpacity onPress={() => setFollowListType('following')} activeOpacity={0.7}>
              <Text style={styles.followText}>
                <Text style={styles.followCount}>{followingCount}</Text>
                {' following'}
              </Text>
            </TouchableOpacity>
          </View>

          {joinedDate ? <Text style={styles.joinDate}>member since {joinedDate.toLowerCase()}</Text> : null}

          {/* Follow button — hidden for own profile */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              onPress={handleToggleFollow}
              activeOpacity={0.7}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
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

        {/* Content */}
        <View style={styles.list}>
          {activeTab === 'embers' ? renderEmberList() : renderBlueList()}
        </View>
      </ScrollView>

      <FollowListSheet
        visible={followListType !== null}
        onClose={() => setFollowListType(null)}
        type={followListType ?? 'followers'}
        count={followListType === 'following' ? followingCount : followerCount}
        targetUserId={userId}
        tabBarHeight={TAB_BAR_HEIGHT}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { paddingBottom: 40 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 8,
    gap: 4,
  },
  backChevron: { fontSize: 26, color: '#666', lineHeight: 30 },
  backUsername: { fontSize: 13, fontWeight: '600', color: '#fff' },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: { fontSize: 26, color: '#f97316' },
  username: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  followRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  followText: { fontSize: 12, color: '#888' },
  followCount: { color: '#ccc', fontWeight: '600' },
  followDot: { fontSize: 12, color: '#888' },
  joinDate: { fontSize: 11, color: '#444', marginTop: 3, letterSpacing: 0.3 },
  followBtn: {
    marginTop: 14,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  followBtnActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  followBtnText: { fontSize: 13, fontWeight: '600', color: '#888' },
  followBtnTextActive: { color: '#fff' },
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
  skeletonCard: { height: 80, backgroundColor: '#111', borderRadius: 10, marginBottom: 8 },
  centered: { alignItems: 'center', paddingVertical: 40 },
  mutedText: { fontSize: 13, color: '#3a3a4a' },
})
```

- [ ] **Step 4: Run all tests**

```bash
npx jest --no-coverage --forceExit
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add "app/user" components/profile/UserProfileSheet.tsx __tests__/components/profile/UserProfileScreen.test.tsx
git commit -m "feat: add public user profile screen"
```

---

## Final check

```bash
npx jest --no-coverage --forceExit
```

All tests should pass. Push when ready.
