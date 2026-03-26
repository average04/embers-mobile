# User Profile Quick View Design

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

When a user taps a username anywhere in the app (ember attribution, followers/following list), a quick-view bottom sheet slides up showing basic profile info and a follow/unfollow button. From the sheet, they can navigate to the full public profile screen. The sheet sits above the tab bar so the tab bar remains visible and usable.

---

## Entry Points

| Location | Component | Data available |
|---|---|---|
| Ember attribution | `EmberDetailSheet` line 596 | `ember.user_id`, `ember.username` |
| Follower/following row | `FollowUserRow` | `userId`, `username` (via new `onUsernamePress` prop) |

If the tapped `userId` equals `session.user.id` (own profile), do nothing — no sheet.

---

## UserProfileSheet Component

`components/profile/UserProfileSheet.tsx`

### Props

```ts
interface Props {
  visible: boolean
  onClose: () => void
  userId: string
  username: string
}
```

### Session access

`useAuthStore((s) => s.session)` directly.

### Positioning — above the tab bar

Use `useBottomTabBarHeight()` from `@react-navigation/bottom-tabs` to get the tab bar height. The sheet's `bottom` is set to this value so it sits directly above the tab bar.

The backdrop covers only from the top to the sheet's top edge, not the full screen — achieved by setting `bottom: tabBarHeight` on both the backdrop and the sheet container:

```tsx
<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  {/* Backdrop — stops at tab bar */}
  <TouchableOpacity
    style={[styles.backdrop, { bottom: tabBarHeight }]}
    activeOpacity={1}
    onPress={onClose}
  />
  {/* Sheet — sits above tab bar */}
  <View style={[styles.sheet, { bottom: tabBarHeight, paddingBottom: insets.bottom > 0 ? 8 : 16 }]}>
    ...
  </View>
</Modal>
```

### Queries (enabled only when `visible === true`)

```ts
// Profile info
queryKey: ['userProfile', userId]
queryFn: async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, created_at')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as { id: string; username: string; created_at: string }
}

// Follower count
queryKey: ['followerCount', userId]
queryFn: async () => {
  const { count, error } = await supabase
    .from('follows')
    .select('id', { count: 'exact', head: true })
    .eq('following_id', userId)
  if (error) throw error
  return count ?? 0
}

// Following count
queryKey: ['followingCount', userId]
queryFn: async () => {
  const { count, error } = await supabase
    .from('follows')
    .select('id', { count: 'exact', head: true })
    .eq('follower_id', userId)
  if (error) throw error
  return count ?? 0
}

// Am I following this user?
queryKey: ['isFollowing', session?.user.id, userId]
queryFn: async () => {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', session!.user.id)
    .eq('following_id', userId)
    .maybeSingle()
  if (error) throw error
  return data !== null
}
```

All four: `enabled: visible && !!userId && !!session`, `staleTime: 30_000`.

### Optimistic follow state

Same pattern as `FollowListSheet` — local `isFollowing` boolean state initialized from query, optimistic toggle with rollback on error.

On success, invalidate:
- `['followerCount', userId]`
- `['followingCount', userId]`
- `['isFollowing', session.user.id, userId]`
- `['followerCount', session.user.id]` (own counts may change)
- `['followingCount', session.user.id]`

### Layout

```
[drag handle]

[ 54×54 avatar ]  @username               [Follow / Following]
                  142 followers · 38 following

────────────────────────────────────

[         View full profile →         ]
```

- Avatar: 54×54 circle, `#f97316` border 2px, initial text `#f97316`
- Username: 15px, `#fff`, fontWeight 700
- Counts: 11px, `#888`, numbers in `#ccc` fontWeight 600
- Follow button: same pill style as `FollowUserRow`
- "View full profile →" button: full-width, `background: #161616`, `borderColor: #222`, `#aaa` text, calls `router.push('/user/' + userId)` then `onClose()`
- Loading: show skeleton — grey rectangle 54px avatar + two grey text bars, no button
- Error: centered "couldn't load" text only (no retry — sheet is lightweight)

### Sheet style

- `background: #111111`
- `borderTopLeftRadius: 18`, `borderTopRightRadius: 18`
- `borderTopWidth: 1`, `borderColor: #1e1e1e`
- `paddingTop: 14`
- `paddingHorizontal: 20`
- Does NOT use `maxHeight` (content is fixed height, no scroll needed)

---

## Public Profile Screen

`app/user/[id].tsx`

Dynamic route. `id` param is the target user's UUID.

### Header

Stack header with back button (Expo Router default back button). Title: `@username` (shown once profile loads, placeholder `…` while loading).

Or: use a custom back row at the top of the scroll view (same approach as the rest of the app if stack headers are not used). Follow the existing pattern in the codebase — check how other screens handle back navigation.

### Queries

Same four as `UserProfileSheet` (profile, followerCount, followingCount, isFollowing), always enabled (not gated on `visible`).

Additionally:
```ts
// Embers
queryKey: ['userEmbers', userId]
queryFn: async () => {
  const { data, error } = await supabase
    .from('embers')
    .select('id, thought, ember_type, created_at, relight_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// Blue embers
queryKey: ['userBlueEmbers', userId]
queryFn: async () => {
  const { data, error } = await supabase
    .from('blue_embers')
    .select('id, title, audio_duration, created_at, relight_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
```

Ember/blue ember queries: `enabled: !!userId && profileQuery.data?.embers_hidden === false`.

> **Note:** `embers_hidden` must be included in the profile query: `.select('id, username, created_at, embers_hidden')`.

### Layout

```
← @username                          (header / back row)

[ 64×64 avatar ]
@username
X followers · Y following            (tappable — opens FollowListSheet)
member since [month year]
[ Follow / Following button ]

━━━━━━━━ EMBERS │ BLUE EMBERS ━━━━━━

[ember cards]
— or —
[skeleton / empty / "embers are private"]
```

- Same tab pattern (EMBERS / BLUE EMBERS) and ember card components as own profile
- Follow button: full-width, orange if not following, grey outline if following
- If `embers_hidden === true`: both tabs show `"this user's embers are private"` (no cards, no skeleton)
- If own userId: hide follow button, show nothing in its place

### `FollowListSheet` reuse

The followers/following counts are tappable, opening `FollowListSheet` with the target user's `userId` — same component, passing `userId` as a prop instead of always using `session.user.id`.

> **Schema note:** `FollowListSheet` currently hardcodes `session.user.id` for all queries. To support viewing another user's profile, the sheet needs a `targetUserId` prop (defaults to `session.user.id` for own profile).

---

## Modified Files

| File | Change |
|---|---|
| `components/profile/FollowUserRow.tsx` | Add optional `onUsernamePress?: (userId: string) => void` prop; wrap `@username` Text in `TouchableOpacity` when prop is provided |
| `components/ember/EmberDetailSheet.tsx` | Wrap `— @username` Text in `TouchableOpacity`; add `userProfileVisible` state + `UserProfileSheet` |
| `components/profile/FollowListSheet.tsx` | Add optional `targetUserId?: string` prop (defaults to `session.user.id`) so it can show another user's followers |
| `components/profile/UserProfileSheet.tsx` | New component |
| `app/user/[id].tsx` | New screen |

---

## Out of Scope

- Blocking / reporting users
- Viewing another user's relight history
- DMs / messaging
- Mutual follow indicator on public profile
