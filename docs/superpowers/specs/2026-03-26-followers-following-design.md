# Followers / Following Design

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

Add followers/following counts and a follow/unfollow list to the user's profile page. Counts appear inline under the username. Tapping either count opens a bottom sheet with a scrollable list of users and per-user follow/unfollow buttons.

---

## Profile Header Changes

The intended final order in the hero section is:

```
@username
48 followers · 12 following     ← NEW (both numbers are tappable)
member since march 2025
[EMBERS | BLUE EMBERS stats row]  ← unchanged
```

Add this line between the username text and the join date text in `profile.tsx`.

- Font size 12px, muted color (`#888`) for the words, numbers in slightly brighter white (`#ccc`, font-weight 600)
- Tapping the follower number/label (wrapped in `TouchableOpacity`) opens the Followers sheet
- Tapping the following number/label opens the Following sheet
- Shows `0` while loading

---

## Follower / Following Counts

Two React Query queries in `profile.tsx`, following the same `async/await + throw on error` pattern as the existing `embersQuery`. Both include `enabled: !!session`.

```ts
// Followers count
queryKey: ['followerCount', session?.user.id]
queryFn: async () => {
  const { count, error } = await supabase
    .from('follows')
    .select('id', { count: 'exact', head: true })
    .eq('following_id', session!.user.id)
  if (error) throw error
  return count ?? 0
}
enabled: !!session

// Following count
queryKey: ['followingCount', session?.user.id]
queryFn: async () => {
  const { count, error } = await supabase
    .from('follows')
    .select('id', { count: 'exact', head: true })
    .eq('follower_id', session!.user.id)
  if (error) throw error
  return count ?? 0
}
enabled: !!session
```

Both counts are passed as props to `FollowListSheet` for display in the sheet header. The count shown in the header may diverge slightly from the displayed list length (a follow relationship could change between cache reads). This is intentional — eventual consistency is acceptable here.

---

## FollowListSheet Component

`components/profile/FollowListSheet.tsx`

### Props

```ts
interface Props {
  visible: boolean
  onClose: () => void
  type: 'followers' | 'following'
  count: number
}
```

### Session access

Uses `useAuthStore((s) => s.session)` directly — no prop drilling.

### Layout

Same modal bottom sheet pattern as `SettingsSheet` — `Modal` with `animationType="slide"`, drag handle, backdrop tap to close, `maxHeight: '85%'`. Use `useSafeAreaInsets` for `paddingBottom: insets.bottom + 16` (improvement over `SettingsSheet`'s hardcoded `paddingBottom: 40`).

- Header: `"Followers · 48"` or `"Following · 12"` (using `count` prop)
- Scrollable list of `FollowUserRow` components
- **Loading:** 3 skeleton rows — dark rectangle `height: 52`, `borderRadius: 8`, opacity pulse animation (same pattern as profile `SkeletonCard`)
- **Error:** centered "couldn't load" + "retry" `TouchableOpacity`
- **Empty (followers):** centered "no followers yet"
- **Empty (following):** centered "not following anyone yet"

### Queries (enabled only when `visible === true`, `staleTime: 30_000`)

All queries use the same `async/await + throw on error` pattern as existing queries in `profile.tsx`.

```ts
// Followers list — two-step: get IDs, then look up profiles
// (follows.follower_id FKs to auth.users, not profiles, so no direct join hint)
queryKey: ['followersList', session?.user.id]
queryFn: async () => {
  const { data: follows, error: e1 } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', session!.user.id)
  if (e1) throw e1
  const ids = (follows ?? []).map(f => f.follower_id)
  if (ids.length === 0) return []
  const { data: profiles, error: e2 } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', ids)
  if (e2) throw e2
  return (profiles ?? []) as { id: string; username: string }[]
}

// Following list — same two-step pattern
queryKey: ['followingList', session?.user.id]
queryFn: async () => {
  const { data: follows, error: e1 } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', session!.user.id)
  if (e1) throw e1
  const ids = (follows ?? []).map(f => f.following_id)
  if (ids.length === 0) return []
  const { data: profiles, error: e2 } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', ids)
  if (e2) throw e2
  return (profiles ?? []) as { id: string; username: string }[]
}

// My follows lookup (used in both sheets)
queryKey: ['myFollows', session?.user.id]
queryFn: async () => {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', session!.user.id)
  if (error) throw error
  return new Set((data ?? []).map(r => r.following_id))
}
```

> **Note:** `avatar_url` does not exist in the `profiles` table. All avatar display uses the username initial fallback only. Do not select or pass `avatar_url`.

The "my follows" lookup is needed in **both** sheets:
- **Followers sheet:** determines which of your followers you follow back
- **Following sheet:** all rows should already be in the set, but the same query is used for consistency

### Optimistic state ownership

The sheet owns the follow state. Keep a local `myFollowingSet` as React state (`useState<Set<string>>`), initialized from the `myFollows` query result. When `onToggle(userId, newValue)` fires (`newValue = true` means "now following", `false` means "now unfollowing"):

1. Immediately update `myFollowingSet` (optimistic) — add or delete `userId`
2. Call the Supabase mutation
3. On error: revert `myFollowingSet` to the previous value

`FollowUserRow` is a pure display component — no local state. It derives everything from props.

On successful follow/unfollow, invalidate:
- `['followerCount', session.user.id]`
- `['followingCount', session.user.id]`
- `['followersList', session.user.id]`
- `['followingList', session.user.id]`
- `['myFollows', session.user.id]`

---

## FollowUserRow Component

`components/profile/FollowUserRow.tsx`

### Props

```ts
interface Props {
  userId: string
  username: string
  isFollowing: boolean
  onToggle: (userId: string, newValue: boolean) => void
  // newValue: true = caller wants to follow, false = caller wants to unfollow
}
```

No `avatarUrl` prop — avatar is always the initial fallback (username first letter, uppercase).

### Layout

```
[36×36 avatar]  @username              [Following] / [Follow]
```

- Avatar: circular 36×36, `background: #1a1a1a`
  - Border: `#f97316` 1.5px if `isFollowing`, `#333` if not
  - Initial text color: `#f97316` if following, `#666` if not
- Username: 13px, `#ddd`
- Button:
  - **Following:** `background: #f97316`, white text "Following", `borderRadius: 6`, `paddingVertical: 5`, `paddingHorizontal: 12`, `fontSize: 11`, `fontWeight: 600`
  - **Follow:** `background: #1a1a1a`, `borderWidth: 1`, `borderColor: #2a2a2a`, text color `#888`, "Follow" — same sizing
- On press: calls `onToggle(userId, !isFollowing)`

---

## Mutations

Both are called from `FollowListSheet` in the optimistic toggle handler:

```ts
// Follow
const { error } = await supabase
  .from('follows')
  .insert({ follower_id: session.user.id, following_id: userId })

// Unfollow
const { error } = await supabase
  .from('follows')
  .delete()
  .eq('follower_id', session.user.id)
  .eq('following_id', userId)
```

---

## Components

| File | Change |
|------|--------|
| `app/(tabs)/profile.tsx` | Add 2 count queries, inline followers/following text under username, open/close state for FollowListSheet (`type` + `visible`), pass `count` prop |
| `components/profile/FollowListSheet.tsx` | New — bottom sheet with list queries, optimistic Set state, skeleton/error/empty |
| `components/profile/FollowUserRow.tsx` | New — pure display row with avatar initial, username, follow button |

---

## Out of Scope

- Viewing another user's profile page
- Push notifications for new followers
- Mutual follow indicator ("follows you back")
- Search within the followers/following list
