# Profile Page Design

**Date:** 2026-03-25
**Status:** Approved

---

## Overview

A basic profile page for the authenticated user. Shows their identity, ember counts, and a scrollable list of their embers. A gear icon opens a settings bottom sheet.

---

## Screen Layout

### Hero Header

- Full-width section with a subtle radial orange glow (`rgba(249,115,22,0.13)`) radiating from the top center
- Centered large avatar (76×76, circular, orange border `#f97316`, orange glow shadow)
  - Shows `avatar_url` image if set, otherwise the first letter of `username` as initial
- Username displayed below avatar (`@handle`, 19px, bold)
- "member since [month year]" subtitle in muted text
- Two stats below, separated by a thin vertical divider:
  - **Embers** count in orange (`#f97316`) — derived from the embers query result length
  - **Blue Embers** count in blue (`#3b82f6`) — derived from the blue embers query result length
  - Stats show `0` while queries are loading
- Gear icon button (⚙) absolutely positioned top-right of the header — opens the settings sheet

### Tabs

Two tabs below the header:
- **Embers** — user's orange embers
- **Blue Embers** — user's blue embers

Active tab indicated by orange underline + orange text. Inactive tab in muted color. Tab resets to **Embers** on every mount.

### Ember List

Scrollable list of ember cards. Each card shows:
- Ember type badge (e.g. `✦ THOUGHT`, `☁ DREAM`) in orange, top-left
- Age + relight count, top-right (e.g. `3d · 7 relights`)
- Thought text in muted white, 12px, line-height 1.55
- Card background `#0f0f0f`, border `#1a1a1a`, border-radius 10

Blue Embers tab shows blue ember cards:
- Title in blue tint
- Audio duration badge (formatted as `m:ss`)
- Age + relight count

### Loading & Error States

Both tabs share the same pattern:
- **Loading:** show 3 skeleton card placeholders (dark rectangles with opacity pulse animation) while the query is in flight
- **Error:** show centered text "couldn't load embers" with a "retry" touchable that calls `refetch()`
- **Empty (Embers):** centered message "no embers yet" in muted text
- **Empty (Blue Embers):** centered message "no blue embers yet" in muted text
- The header always renders regardless of query state

---

## Settings Bottom Sheet

Triggered by tapping the gear icon. Slides up as a modal bottom sheet (react-native `Modal` with slide animation) with a drag handle at the top.

### Items

| Row | Type | Detail |
|-----|------|--------|
| Change username | Expand inline | Reveals a text input + Save button within the sheet; on save calls Supabase update + syncs Zustand store |
| Change password | Fire-and-forget | Calls `supabase.auth.resetPasswordForEmail(email)`, shows success toast "Password reset email sent", no navigation |
| Hide my embers from map | Toggle | Maps to `profiles.embers_hidden`; optimistic toggle, reverts on error |
| Sign out | Destructive | Calls `useAuth().signOut()`, red text, centered |

### Mutation Feedback

- **Username saved:** inline success text "username updated" below the input, then collapses after 1.5s
- **Username error (conflict):** inline error text "username already taken"
- **Username validation error:** inline error text "3–20 chars, letters, numbers and underscores only" — validated client-side with `/^[a-zA-Z0-9_]{3,20}$/` before submitting
- **Uniqueness:** rely on Supabase unique constraint — catch `23505` error code and show "username already taken"
- **Password reset:** toast message (temporary overlay) "Password reset email sent"
- **Toggle error:** silently revert the toggle and show brief toast "couldn't save setting"
- **Sign out error:** toast "sign out failed, try again"
- **Settings sheet dismiss:** dragging to close discards any unsaved username input without confirmation

---

## Data

### Queries

- **Embers:** `supabase.from('embers').select('id, thought, ember_type, created_at, relight_count').eq('user_id', session.user.id).order('created_at', { ascending: false })`
  - `relit_at` omitted — not used in card display or sort order
- **Blue Embers:** `supabase.from('blue_embers').select('id, title, audio_duration, created_at, relight_count').eq('user_id', session.user.id).order('created_at', { ascending: false })`
  - `audio_duration` is stored as integer seconds. Format as `m:ss` (e.g. 90 → `1:30`)
  - `relit_at` is omitted — not used in card display or sort order
- **Profile:** already in Zustand `authStore` — no additional fetch needed

### Mutations

- **Toggle `embers_hidden`:** `supabase.from('profiles').update({ embers_hidden: value }).eq('id', session.user.id)` + update Zustand `profile`
- **Change username:** `supabase.from('profiles').update({ username: newUsername }).eq('id', session.user.id)` + update Zustand `profile`
- **Change password:** `supabase.auth.resetPasswordForEmail(session.user.email)`

---

## Components

- `app/(tabs)/profile.tsx` — main profile screen
- `components/profile/SettingsSheet.tsx` — bottom sheet with settings rows and inline username form
- `components/profile/EmberCard.tsx` — card for orange embers list
- `components/profile/BlueEmberCard.tsx` — card for blue embers list

---

## Navigation

- Profile tab is part of the main tab bar
- Change username is handled inline within the settings sheet (expand/collapse), not a separate route
- Change password is fire-and-forget — no navigation

---

## Out of Scope (Phase 4+)

- Avatar upload / change (avatar is display-only for now)
- Viewing other users' profiles
- Follow / block
- Faded embers tab
- Interactions tab
- Push notification settings
