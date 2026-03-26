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

**Suppression rules — do NOT open the sheet when:**
- `userId` equals `session.user.id` (own profile)
- `user_id` is `null` or `undefined` (ember has no attached user — wrap the `TouchableOpacity` only when `ember.user_id` is a non-empty string)

---

## UserProfileSheet Component

`components/profile/UserProfileSheet.tsx`

### Props

```ts
interface Props {
  visible: boolean
  onClose: () => void
  userId: string       // always a non-empty string when visible
  username: string
  tabBarHeight: number // passed in by the caller — see Positioning section
}
```

### Session access

`useAuthStore((s) => s.session)` directly.

### Positioning — above the tab bar

`useBottomTabBarHeight()` from `@react-navigation/bottom-tabs` provides the tab bar height **only inside screen components** within the tab navigator. `UserProfileSheet` is a generic component that may be rendered inside a Modal (e.g. from `EmberDetailSheet`) where the context may not be available.

**Solution:** The app uses a fully custom tab bar (`components/navigation/BottomTabBar.tsx`) that renders as a plain `<View style={{ height: 62 }}>`. It does **not** register with React Navigation's `BottomTabBarHeightContext`, so `useBottomTabBarHeight()` always returns `0` — do not use that hook.

Instead, export a named constant from `BottomTabBar.tsx`:

```ts
export const TAB_BAR_HEIGHT = 62
```

Import and use this constant wherever `tabBarHeight` is needed. `UserProfileSheet` accepts it as a prop:

- In `app/(tabs)/map.tsx`: import `TAB_BAR_HEIGHT` and pass it to `EmberDetailSheet` as `tabBarHeight={TAB_BAR_HEIGHT}`. `EmberDetailSheet` is a centered-card Modal (`animationType="fade"`) and does **not** use `tabBarHeight` itself — it simply passes it straight through to `UserProfileSheet`.
- In `components/profile/FollowListSheet.tsx`: add `tabBarHeight?: number` (optional, defaults to `0`) so it can forward the value to `UserProfileSheet`. Existing call sites in `profile.tsx` pass no value; `0` is the safe default there since `FollowListSheet` is a full-screen Modal itself.
- In `app/(tabs)/profile.tsx`: no change needed.
- In `app/user/[id].tsx`: import `TAB_BAR_HEIGHT` and pass it to `FollowListSheet` as `tabBarHeight={TAB_BAR_HEIGHT}`.

The backdrop covers content but stops at the tab bar. The sheet slides up to sit directly above the tab bar:

```tsx
<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  {/* Backdrop — stops at tab bar */}
  <TouchableOpacity
    style={[styles.backdrop, { bottom: tabBarHeight }]}
    activeOpacity={1}
    onPress={onClose}
  />
  {/* Sheet — sits above tab bar */}
  <View style={[styles.sheet, { bottom: tabBarHeight }]}>
    ...
  </View>
</Modal>
```

`paddingBottom` inside the sheet: `16` (fixed, no safe area adjustment needed since the sheet does not extend to the screen bottom).

### Queries (enabled only when `visible === true && !!userId && !!session`)

**Avatars are initial-text only.** The `profiles` table has no `avatar_url` column — do not select or reference it anywhere in this feature.

```ts
// Profile info (includes embers_hidden for later use on public profile)
queryKey: ['userProfile', userId]
queryFn: async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, created_at, embers_hidden')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as { id: string; username: string; created_at: string; embers_hidden: boolean }
}

// Follower count for target user
queryKey: ['followerCount', userId]
queryFn: async () => {
  const { count, error } = await supabase
    .from('follows')
    .select('id', { count: 'exact', head: true })
    .eq('following_id', userId)
  if (error) throw error
  return count ?? 0
}

// Following count for target user
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

All four: `staleTime: 30_000`.

### Optimistic follow state

Local `isFollowing` boolean state initialized from the `isFollowing` query result via `useEffect`. Optimistic toggle with rollback on error — same pattern as `FollowListSheet`.

On successful follow/unfollow, invalidate:
- `['followerCount', userId]` — target's follower count
- `['followingCount', userId]` — target's following count
- `['isFollowing', session.user.id, userId]`
- `['followerCount', session.user.id]` — own following count changes
- `['followingCount', session.user.id]`
- `['followersList', userId]` — in case FollowListSheet is open on target's profile
- `['followingList', userId]`
- `['myFollows', session.user.id]`

> `FollowListSheet.handleToggle` (after the `targetUserId` change) must also invalidate `['followersList', viewedUserId]` and `['followingList', viewedUserId]` in addition to existing keys, so a follow/unfollow from within someone else's follower list refreshes that list.

### Layout

```
[drag handle]

[ 54×54 avatar ]  @username               [Follow / Following]
                  142 followers · 38 following

────────────────────────────────────

[         View full profile →         ]
```

- Avatar: 54×54 circle, `#1a1a1a` background, `#f97316` border 2px, initial text `#f97316` 22px
- Username: 15px, `#fff`, fontWeight 700
- Counts: 11px, `#888`, numbers in `#ccc` fontWeight 600
- Follow button: same pill style as `FollowUserRow` (orange bg + white text when not following; grey bg + grey text when following)
- "View full profile →" button: full-width, `background: #161616`, `borderWidth: 1`, `borderColor: #222`, 13px `#aaa` text, calls `router.push('/user/' + userId)` then `onClose()`
- **Loading:** skeleton — grey oval 54px + two grey text bars, no button
- **Error:** centered "couldn't load" in `#3a3a4a`, no retry (sheet is lightweight)

### Sheet style

- `background: #111111`
- `borderTopLeftRadius: 18`, `borderTopRightRadius: 18`
- `borderTopWidth: 1`, `borderColor: #1e1e1e`
- `paddingTop: 14`, `paddingBottom: 16`, `paddingHorizontal: 20`
- No `maxHeight` — content is fixed height, no scroll needed

---

## Public Profile Screen

`app/user/[id].tsx`

Dynamic route. `id` param is the target user's UUID. No `_layout.tsx` needed in `app/user/` — Expo Router uses the root `_layout.tsx` and treats this as a stack route (pushes on top of current navigator). Back navigation uses `router.back()`.

### Back row

Custom back row at the top of the `ScrollView` (not a stack header — this app has no other screens using Expo Router stack headers):

```tsx
<TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
  <Text style={styles.backChevron}>‹</Text>
  <Text style={styles.backUsername}>@{profileQuery.data?.username ?? '…'}</Text>
</TouchableOpacity>
```

### Queries

Same four as `UserProfileSheet` (userProfile, followerCount, followingCount, isFollowing), always enabled (`enabled: !!userId && !!session`).

Additionally:
```ts
// Embers
queryKey: ['userEmbers', userId]
enabled: !!userId && profileQuery.data?.embers_hidden === false
queryFn: async () => {
  const { data, error } = await supabase
    .from('embers')
    .select('id, thought, ember_type, created_at, relight_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ProfileEmber[]
}

// Blue embers
queryKey: ['userBlueEmbers', userId]
enabled: !!userId && profileQuery.data?.embers_hidden === false
queryFn: async () => {
  const { data, error } = await supabase
    .from('blue_embers')
    .select('id, title, audio_duration, created_at, relight_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ProfileBlueEmber[]
}
```

**Ember query gate:** `enabled: !!userId && profileQuery.data?.embers_hidden === false`. While `profileQuery` is loading, `profileQuery.data` is `undefined` → ember queries stay disabled (correct). If `profileQuery` errors, `profileQuery.data` stays `undefined` → show `profileQuery.isError` error state in the ember tab area (centered "couldn't load profile").

### Layout

```
‹ @username                          (custom back row)

[ 64×64 avatar ]
@username
X followers · Y following            (both tappable — opens FollowListSheet)
member since [month year]
[ Follow / Following button ]        (hidden if userId === session.user.id)

━━━━━━━━ EMBERS │ BLUE EMBERS ━━━━━━

[ember cards / skeleton / empty / private / error]
```

- Avatar: 64×64 circle, `#1a1a1a` background, `#f97316` border 2px, initial text `#f97316` 26px
- Follow button: full-width, same visual states as `FollowUserRow` pill but full-width with `paddingVertical: 10`
- `embers_hidden === true`: both tabs show centered `"this user's embers are private"` (`#3a3a4a`)
- `profileQuery.isError`: show centered "couldn't load profile" in the content area, no tabs
- `profileQuery.isLoading`: show skeleton header + 3 skeleton cards
- Own userId (`userId === session.user.id`): hide follow button
- `embers_hidden === true`: "this user's embers are private" shows even when viewing your own public profile — no bypass. The public profile screen always shows the public view.

### `FollowListSheet` on public profile

Tap followers/following count → open `FollowListSheet` with `targetUserId` prop set to the target user's ID. Uses the same `FollowListSheet` component with the extended prop described below.

---

## FollowListSheet Changes

Add optional `targetUserId?: string` prop. When provided, all query keys and query functions use `targetUserId` instead of `session.user.id`:

```ts
const viewedUserId = targetUserId ?? session?.user.id
queryKey: ['followersList', viewedUserId]
queryKey: ['followingList', viewedUserId]
queryKey: ['myFollows', session?.user.id]  // always own ID — needed for follow button state
```

The `myFollows` query always uses `session.user.id` (it tells us who WE follow, regardless of whose profile we're viewing). The list queries use `viewedUserId`.

**Backward compatibility:** existing call sites in `app/(tabs)/profile.tsx` pass no `targetUserId`, so `viewedUserId` falls back to `session.user.id` — no change in behavior.

---

## Modified Files

| File | Change |
|---|---|
| `components/profile/UserProfileSheet.tsx` | New component |
| `app/user/[id].tsx` | New screen |
| `components/profile/FollowUserRow.tsx` | Add optional `onUsernamePress?: (userId: string) => void`; wrap `@username` in `TouchableOpacity` when prop provided |
| `components/ember/EmberDetailSheet.tsx` | Accept `tabBarHeight: number` prop (pass-through only — not used by EmberDetailSheet itself); make `— @username` tappable when `ember.user_id` is non-empty string and not own; render `UserProfileSheet` |
| `components/profile/FollowListSheet.tsx` | Add optional `targetUserId?: string` and `tabBarHeight?: number` (defaults to `0`) props; use `viewedUserId` in list query keys/fns; update `handleToggle` invalidations to include `viewedUserId` list keys; pass `onUsernamePress` to `FollowUserRow` only when `user.id !== session.user.id` (own-profile suppression); forward `tabBarHeight` to `UserProfileSheet` |
| `components/navigation/BottomTabBar.tsx` | Export `TAB_BAR_HEIGHT = 62` constant |
| `app/(tabs)/map.tsx` | Import `TAB_BAR_HEIGHT`; pass `tabBarHeight={TAB_BAR_HEIGHT}` to `EmberDetailSheet` |
| `app/(tabs)/profile.tsx` | No query changes; `FollowListSheet` call unchanged (no `targetUserId` needed for own profile) |

---

## Out of Scope

- Blocking / reporting users
- Viewing another user's relight history
- DMs / messaging
- Mutual follow indicator on public profile
