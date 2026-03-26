# Followers / Following Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add follower/following counts inline under the username on the profile page, with a tappable bottom sheet showing a scrollable list of users and per-user follow/unfollow buttons.

**Architecture:** Three focused changes — a pure display row component (`FollowUserRow`), a bottom sheet that owns follow state and runs the Supabase queries (`FollowListSheet`), and modifications to `profile.tsx` to add count queries and wire up the sheet. Optimistic updates live in `FollowListSheet` via a local `Set<string>`.

**Tech Stack:** React Native / Expo / TypeScript, Supabase JS v2, React Query (`useQuery`, `useQueryClient`), Zustand (`authStore`), `react-native-safe-area-context`, `@testing-library/react-native` (Jest)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/profile/FollowUserRow.tsx` | Create | Pure display row: avatar initial, @username, Follow/Following button |
| `components/profile/FollowListSheet.tsx` | Create | Bottom sheet with list queries, optimistic Set state, skeleton/error/empty |
| `app/(tabs)/profile.tsx` | Modify | Add count queries, inline followers/following text, open FollowListSheet |
| `__tests__/components/profile/FollowUserRow.test.tsx` | Create | Unit tests for FollowUserRow |
| `__tests__/components/profile/FollowListSheet.test.tsx` | Create | Unit tests for FollowListSheet |

---

## Task 1: FollowUserRow component

**Files:**
- Create: `components/profile/FollowUserRow.tsx`
- Create: `__tests__/components/profile/FollowUserRow.test.tsx`

- [ ] **Step 1.1: Write failing tests**

Create `__tests__/components/profile/FollowUserRow.test.tsx`:

```tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { FollowUserRow } from '@/components/profile/FollowUserRow'

const base = {
  userId: 'u1',
  username: 'alice_sparks',
  isFollowing: false,
  onToggle: jest.fn(),
}

describe('FollowUserRow', () => {
  it('renders the username', () => {
    const { getByText } = render(<FollowUserRow {...base} />)
    expect(getByText('@alice_sparks')).toBeTruthy()
  })

  it('shows Follow button when not following', () => {
    const { getByText } = render(<FollowUserRow {...base} isFollowing={false} />)
    expect(getByText('Follow')).toBeTruthy()
  })

  it('shows Following button when following', () => {
    const { getByText } = render(<FollowUserRow {...base} isFollowing={true} />)
    expect(getByText('Following')).toBeTruthy()
  })

  it('calls onToggle(userId, true) when Follow is pressed', () => {
    const onToggle = jest.fn()
    const { getByText } = render(<FollowUserRow {...base} isFollowing={false} onToggle={onToggle} />)
    fireEvent.press(getByText('Follow'))
    expect(onToggle).toHaveBeenCalledWith('u1', true)
  })

  it('calls onToggle(userId, false) when Following is pressed', () => {
    const onToggle = jest.fn()
    const { getByText } = render(<FollowUserRow {...base} isFollowing={true} onToggle={onToggle} />)
    fireEvent.press(getByText('Following'))
    expect(onToggle).toHaveBeenCalledWith('u1', false)
  })
})
```

- [ ] **Step 1.2: Run tests — verify they fail**

```bash
npx jest __tests__/components/profile/FollowUserRow.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/profile/FollowUserRow'`

- [ ] **Step 1.3: Implement FollowUserRow**

Create `components/profile/FollowUserRow.tsx`:

```tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  userId: string
  username: string
  isFollowing: boolean
  onToggle: (userId: string, newValue: boolean) => void
}

export function FollowUserRow({ userId, username, isFollowing, onToggle }: Props) {
  const initial = username.charAt(0).toUpperCase()
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, isFollowing && styles.avatarFollowing]}>
        <Text style={[styles.avatarInitial, isFollowing && styles.avatarInitialFollowing]}>
          {initial}
        </Text>
      </View>
      <Text style={styles.username}>@{username}</Text>
      <TouchableOpacity
        style={[styles.btn, isFollowing && styles.btnFollowing]}
        onPress={() => onToggle(userId, !isFollowing)}
        activeOpacity={0.7}
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
  username: { flex: 1, fontSize: 13, color: '#ddd' },
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

- [ ] **Step 1.4: Run tests — verify they pass**

```bash
npx jest __tests__/components/profile/FollowUserRow.test.tsx --no-coverage
```

Expected: PASS — 5 tests

- [ ] **Step 1.5: Commit**

```bash
git add components/profile/FollowUserRow.tsx __tests__/components/profile/FollowUserRow.test.tsx
git commit -m "feat: add FollowUserRow component"
```

---

## Task 2: FollowListSheet component

**Files:**
- Create: `components/profile/FollowListSheet.tsx`
- Create: `__tests__/components/profile/FollowListSheet.test.tsx`

- [ ] **Step 2.1: Write failing tests**

Create `__tests__/components/profile/FollowListSheet.test.tsx`:

```tsx
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FollowListSheet } from '@/components/profile/FollowListSheet'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn((selector: any) =>
    selector({ session: { user: { id: 'me' } } })
  ),
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

function setupMocks(users: { id: string; username: string }[]) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ data: users, error: null }),
        }),
      }
    }
    // follows table
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: users.map(u => ({ follower_id: u.id, following_id: u.id })),
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
  type: 'followers' as const,
  count: 5,
}

describe('FollowListSheet', () => {
  beforeEach(() => {
    setupMocks([{ id: 'u1', username: 'alice_sparks' }])
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the followers title with count', () => {
    const { getByText } = render(<FollowListSheet {...defaultProps} />, { wrapper: makeWrapper() })
    expect(getByText('Followers · 5')).toBeTruthy()
  })

  it('renders the following title with count', () => {
    const { getByText } = render(
      <FollowListSheet {...defaultProps} type="following" count={3} />,
      { wrapper: makeWrapper() }
    )
    expect(getByText('Following · 3')).toBeTruthy()
  })

  it('renders username after data loads', async () => {
    const { getByText } = render(<FollowListSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('@alice_sparks')).toBeTruthy())
  })

  it('shows empty message when no users', async () => {
    setupMocks([])
    const { getByText } = render(<FollowListSheet {...defaultProps} />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('no followers yet')).toBeTruthy())
  })

  it('shows not-following-anyone message for empty following list', async () => {
    setupMocks([])
    const { getByText } = render(
      <FollowListSheet {...defaultProps} type="following" count={0} />,
      { wrapper: makeWrapper() }
    )
    await waitFor(() => expect(getByText('not following anyone yet')).toBeTruthy())
  })
})
```

- [ ] **Step 2.2: Run tests — verify they fail**

```bash
npx jest __tests__/components/profile/FollowListSheet.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/profile/FollowListSheet'`

- [ ] **Step 2.3: Implement FollowListSheet**

Create `components/profile/FollowListSheet.tsx`:

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

export function FollowListSheet({ visible, onClose, type, count }: Props) {
  const insets = useSafeAreaInsets()
  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()
  const userId = session?.user.id

  const listQuery = useQuery<UserEntry[]>({
    queryKey: [type === 'followers' ? 'followersList' : 'followingList', userId],
    queryFn: async () => {
      if (type === 'followers') {
        const { data: follows, error: e1 } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId!)
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
          .eq('follower_id', userId!)
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
    enabled: visible && !!userId,
    staleTime: 30_000,
  })

  const myFollowsQuery = useQuery<Set<string>>({
    queryKey: ['myFollows', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId!)
      if (error) throw error
      return new Set((data ?? []).map((r: any) => r.following_id))
    },
    enabled: visible && !!userId,
    staleTime: 30_000,
  })

  const [myFollowingSet, setMyFollowingSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (myFollowsQuery.data) {
      setMyFollowingSet(new Set(myFollowsQuery.data))
    }
  }, [myFollowsQuery.data])

  async function handleToggle(targetId: string, newValue: boolean) {
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
        .insert({ follower_id: userId!, following_id: targetId })
      error = res.error
    } else {
      const res = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId!)
        .eq('following_id', targetId)
      error = res.error
    }

    if (error) {
      setMyFollowingSet(prev)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['followerCount', userId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', userId] })
    queryClient.invalidateQueries({ queryKey: ['followersList', userId] })
    queryClient.invalidateQueries({ queryKey: ['followingList', userId] })
    queryClient.invalidateQueries({ queryKey: ['myFollows', userId] })
  }

  const title = type === 'followers' ? `Followers · ${count}` : `Following · ${count}`
  const emptyMsg = type === 'followers' ? 'no followers yet' : 'not following anyone yet'

  function renderList() {
    if (listQuery.isLoading || myFollowsQuery.isLoading) {
      return <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
    }
    if (listQuery.isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>couldn't load</Text>
          <TouchableOpacity onPress={() => listQuery.refetch()} activeOpacity={0.7}>
            <Text style={styles.retryText}>retry</Text>
          </TouchableOpacity>
        </View>
      )
    }
    if (!listQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.emptyText}>{emptyMsg}</Text></View>
    }
    return listQuery.data.map(user => (
      <React.Fragment key={user.id}>
        <FollowUserRow
          userId={user.id}
          username={user.username}
          isFollowing={myFollowingSet.has(user.id)}
          onToggle={handleToggle}
        />
        <View style={styles.separator} />
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

- [ ] **Step 2.4: Run tests — verify they pass**

```bash
npx jest __tests__/components/profile/FollowListSheet.test.tsx --no-coverage
```

Expected: PASS — 5 tests

- [ ] **Step 2.5: Commit**

```bash
git add components/profile/FollowListSheet.tsx __tests__/components/profile/FollowListSheet.test.tsx
git commit -m "feat: add FollowListSheet component"
```

---

## Task 3: Wire into profile.tsx

**Files:**
- Modify: `app/(tabs)/profile.tsx`

No new test file needed — the components are tested in isolation above; `profile.tsx` is an integration screen with no unit tests.

- [ ] **Step 3.1: Add import and state**

In `app/(tabs)/profile.tsx`, add the import at the top (after the existing profile imports):

```tsx
import { FollowListSheet } from '@/components/profile/FollowListSheet'
```

Inside `ProfileTab()`, after `const [settingsOpen, setSettingsOpen] = useState(false)`, add:

```tsx
const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null)
```

- [ ] **Step 3.2: Add follower/following count queries**

In `app/(tabs)/profile.tsx`, find this exact block:

```tsx
  const emberCount = embersQuery.data?.length ?? 0
  const blueCount = blueEmbersQuery.data?.length ?? 0
```

Replace it with:

```tsx
  const emberCount = embersQuery.data?.length ?? 0
  const blueCount = blueEmbersQuery.data?.length ?? 0

  const followerCountQuery = useQuery<number>({
    queryKey: ['followerCount', session?.user.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', session!.user.id)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!session,
  })

  const followingCountQuery = useQuery<number>({
    queryKey: ['followingCount', session?.user.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', session!.user.id)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!session,
  })

  const followerCount = followerCountQuery.data ?? 0
  const followingCount = followingCountQuery.data ?? 0
```

- [ ] **Step 3.3: Add inline followers/following text in JSX**

In the JSX, find this block:

```tsx
<Text style={styles.username}>@{profile?.username ?? '...'}</Text>
{joinedDate ? <Text style={styles.joinDate}>member since {joinedDate.toLowerCase()}</Text> : null}
```

Replace it with:

```tsx
<Text style={styles.username}>@{profile?.username ?? '...'}</Text>
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
```

- [ ] **Step 3.4: Add new styles**

In `app/(tabs)/profile.tsx`, find this exact line in `StyleSheet.create`:

```tsx
  joinDate: { fontSize: 11, color: '#444', marginTop: 3, letterSpacing: 0.3 },
```

Replace it with:

```tsx
  joinDate: { fontSize: 11, color: '#444', marginTop: 3, letterSpacing: 0.3 },
  followRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  followText: { fontSize: 12, color: '#888' },
  followCount: { color: '#ccc', fontWeight: '600' },
  followDot: { fontSize: 12, color: '#888' },
```

- [ ] **Step 3.5: Add FollowListSheet to JSX**

In `app/(tabs)/profile.tsx`, find this exact line:

```tsx
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
```

Replace it with:

```tsx
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <FollowListSheet
        visible={followListType !== null}
        onClose={() => setFollowListType(null)}
        type={followListType ?? 'followers'}
        count={followListType === 'followers' ? followerCount : followingCount}
      />
```

- [ ] **Step 3.6: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass (no regressions)

- [ ] **Step 3.7: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: add followers/following counts and list to profile"
```
