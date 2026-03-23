# Bottom Nav Redesign

**Date:** 2026-03-24
**Status:** Approved

## Summary

Replace the current drawer navigator with a bottom tab navigator (3 tabs: Map, Feed, Boards). Remove the sidebar entirely. Profile remains accessible via the top-right pill.

---

## Navigation Structure

### Bottom Tab Bar

- **API:** `expo-router`'s `<Tabs>` with a custom `tabBar` prop component (`BottomTabBar`)
- **Background:** `#0a0a0a`, top border `1px #181818`, total height `58px`
- **Icons:** Heroicons v2 outline, 20×20 SVG inline, `stroke-width: 1.5`
  - Inactive stroke: `#3a3a4a`
  - Active stroke: `#f97316`
- **Active indicator:** 4×4px dot, `borderRadius: 2`, `backgroundColor: #f97316`, centered below icon
- **Cell layout (per tab, within 58px bar):**
  - `paddingTop: 10px` → icon (20px) → `gap: 5px` → dot (4px) → `paddingBottom: 8px`
- **Tabs (left to right):**
  1. **Map** — Heroicons `map` outline
  2. **Feed** — Heroicons `newspaper` outline
  3. **Boards** — Heroicons `squares-2x2` outline

### Removed

- Drawer navigator (`app/(drawer)/`) and all related components
- `components/navigation/DrawerContent.tsx`
- `store/notifStore.ts` and its test `__tests__/store/notifStore.test.ts`
- The `›` edge button on the map screen and all `DrawerActions` imports

### Kept

- `TopBar` (updated — profile pill top-right, sign-in button for guests, route updated to `/(tabs)/profile`)
- Embers logo top-left on map screen only

---

## Screens

### Map (`app/(tabs)/map.tsx`)
- Full-screen Leaflet WebView, unchanged content
- Embers logo (Cormorant Garamond, top-left) stays
- TopBar overlay stays
- LocationSearch (currently commented out) uncommented and repositioned — see Search section

### Feed (`app/(tabs)/feed.tsx`)
- Existing screen, no content changes
- TopBar overlay added

### Boards (`app/(tabs)/boards.tsx`)
- Renamed from `notifications.tsx` — **stub only in this phase**
- Placeholder content (same pattern as current notifications stub)
- Full Trending/Recent implementation is a separate future phase

### Profile (`app/profile/` — outside tabs)
- Move `app/(drawer)/profile/` → `app/profile/` (non-tab, stack route)
- Accessible from TopBar pill → `router.push('/profile')`
- Internal `/(drawer)/profile/settings` reference updated to `/profile/settings`

---

## File Changes

| Action | Path |
|--------|------|
| Rename dir | `app/(drawer)/` → `app/(tabs)/` |
| Rewrite | `app/(tabs)/_layout.tsx` — `<Tabs>` with custom `BottomTabBar`, `headerShown: false` |
| Rename | `app/(tabs)/notifications.tsx` → `app/(tabs)/boards.tsx` (stub) |
| Move | `app/(drawer)/profile/` → `app/profile/` |
| Delete | `components/navigation/DrawerContent.tsx` |
| Delete | `store/notifStore.ts` |
| Delete | `__tests__/store/notifStore.test.ts` |
| Create | `components/navigation/BottomTabBar.tsx` |
| Update | `components/navigation/TopBar.tsx` — remove drawer imports, update route to `/profile`, add search icon |
| Update | `app/(tabs)/map.tsx` — remove drawer arrow, add LocationSearch |
| Update | `app/(tabs)/profile/index.tsx` → `app/profile/index.tsx` — update settings route |
| Update | `app/index.tsx` — update `/(drawer)/map` → `/(tabs)/map` (2 occurrences) |
| Update | All other `/(drawer)/` references → `/(tabs)/` |

---

## SVG Icon Paths (Heroicons v2 outline, viewBox="0 0 24 24", stroke-linecap="round", stroke-linejoin="round")

**Map:**
```
M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z
```

**Feed (Newspaper):**
```
M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z
```

**Boards (Squares 2×2):**
```
M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z
```

---

## Search

### Location Search (Map screen only)
- Existing `components/map/LocationSearch.tsx` — uncomment in `map.tsx`
- Position: absolute, `top: 100` (below Embers logo), `left: 16, right: 16`, `zIndex: 50`
- Dropdown results `maxHeight: 180` with `bottom` inset aware of 58px tab bar (use `marginBottom` on results if needed)
- Searches place names → pans map to selected location

### Username Search (Out of scope — future phase)
- Magnifying glass in TopBar → full-screen profile search overlay
- Deferred: no existing component, non-trivial new UI

---

## Prerequisites

- `react-native-heroicons` must be installed before `BottomTabBar.tsx` can compile:
  ```bash
  npx expo install react-native-heroicons
  ```
- `@react-navigation/bottom-tabs` — already installed (^7.4.0)
- `react-native-svg` — already installed (^15.15.4)

---

## Out of Scope

- Boards full Trending/Recent data implementation
- Username search overlay
- Profile screen content changes
- Auth flow changes
