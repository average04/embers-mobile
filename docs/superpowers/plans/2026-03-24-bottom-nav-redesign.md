# Bottom Nav Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the drawer navigator with a 3-tab bottom nav (Map, Feed, Boards) and remove the sidebar entirely.

**Architecture:** Rename `app/(drawer)/` → `app/(tabs)/`, rewrite `_layout.tsx` to use expo-router's `<Tabs>` with a custom `BottomTabBar` component, move `profile/` outside tabs to `app/profile/`, update all route references, and delete obsolete drawer/notif files.

**Tech Stack:** Expo Router v6 (`<Tabs>`), `@react-navigation/bottom-tabs` (already installed), `react-native-heroicons` (new), `react-native-svg` (already installed)

**Spec:** `docs/superpowers/specs/2026-03-24-bottom-nav-redesign.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/navigation/BottomTabBar.tsx` | **Create** | Custom tab bar with inline Heroicons SVGs + orange dot |
| `app/(tabs)/_layout.tsx` | **Rewrite** | `<Tabs>` navigator with `BottomTabBar`, no headers |
| `app/(tabs)/map.tsx` | **Update** | Remove drawer arrow + imports, uncomment LocationSearch |
| `app/(tabs)/feed.tsx` | **Update** | No content change (already has TopBar) |
| `app/(tabs)/boards.tsx` | **Create** | Stub (renamed from notifications, no notifStore) |
| `app/profile/index.tsx` | **Move+Update** | Move from `(drawer)/profile/`, fix settings route |
| `app/profile/settings.tsx` | **Move** | Move from `(drawer)/profile/settings.tsx` |
| `app/index.tsx` | **Update** | `/(drawer)/map` → `/(tabs)/map` (2 occurrences) |
| `components/navigation/TopBar.tsx` | **Update** | Route `/(drawer)/profile` → `/profile` |
| `components/navigation/DrawerContent.tsx` | **Delete** | Replaced by BottomTabBar |
| `store/notifStore.ts` | **Delete** | No longer used |
| `__tests__/store/notifStore.test.ts` | **Delete** | No longer used |

---

## Task 1: Install dependency and delete obsolete files

**Files:**
- Delete: `components/navigation/DrawerContent.tsx`
- Delete: `store/notifStore.ts`
- Delete: `__tests__/store/notifStore.test.ts`

- [ ] **Step 1: Install react-native-heroicons**

```bash
npx expo install react-native-heroicons
```

Expected: resolves without error, `package.json` updated with `react-native-heroicons`.

- [ ] **Step 2: Delete obsolete files**

```bash
rm components/navigation/DrawerContent.tsx
rm store/notifStore.ts
rm __tests__/store/notifStore.test.ts
```

- [ ] **Step 3: Verify Jest passes (notifStore test gone)**

```bash
npx jest --passWithNoTests
```

Expected: no `notifStore` test failures.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: install react-native-heroicons, delete drawer/notifStore files"
```

---

## Task 2: Create BottomTabBar component

**Files:**
- Create: `components/navigation/BottomTabBar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/navigation/BottomTabBar.tsx
import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

const ICONS: Record<string, { d: string }> = {
  map: {
    d: 'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z',
  },
  feed: {
    d: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z',
  },
  boards: {
    d: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  },
}

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index
        const icon = ICONS[route.name]

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke={isFocused ? '#f97316' : '#3a3a4a'}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icon && <Path d={icon.d} />}
            </Svg>
            <View style={[styles.dot, isFocused && styles.dotActive]} />
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#181818',
  },
  tab: {
    flex: 1,
    paddingTop: 10,
    alignItems: 'center',
    gap: 5,
    paddingBottom: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: '#f97316',
  },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in `BottomTabBar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/navigation/BottomTabBar.tsx
git commit -m "feat: add BottomTabBar component with Heroicons SVGs"
```

---

## Task 3: Rename directory and rewrite layout

**Files:**
- Rename: `app/(drawer)/` → `app/(tabs)/`
- Rewrite: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Rename the directory and immediately delete notifications.tsx**

```bash
mv "app/(drawer)" "app/(tabs)"
rm "app/(tabs)/notifications.tsx"
```

The `notifications.tsx` imports the already-deleted `notifStore` — deleting it now prevents a broken committed state. The `boards.tsx` stub is created in Task 4.

- [ ] **Step 2: Rewrite `app/(tabs)/_layout.tsx`**

```tsx
// app/(tabs)/_layout.tsx
import React from 'react'
import { Tabs } from 'expo-router'
import { BottomTabBar } from '@/components/navigation/BottomTabBar'

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="map" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="boards" />
    </Tabs>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat: replace drawer layout with bottom tabs navigator"
```

---

## Task 4: Create boards stub

**Files:**
- Create: `app/(tabs)/boards.tsx` (replaces `notifications.tsx` which was renamed with the directory)

- [ ] **Step 1: Write boards.tsx stub**

The old `notifications.tsx` still exists in the renamed dir but references `notifStore` which is deleted. Replace it:

```tsx
// app/(tabs)/boards.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TopBar } from '@/components/navigation/TopBar'

export default function BoardsScreen() {
  return (
    <View style={styles.container}>
      <TopBar />
      <Text style={styles.text}>Boards</Text>
      <Text style={styles.sub}>Trending & Recent — Coming Soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, color: '#f97316', fontWeight: '700' },
  sub: { fontSize: 14, color: '#4a5568', marginTop: 8 },
})
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add boards stub screen (replaces notifications)"
```

---

## Task 5: Move profile outside tabs

**Files:**
- Create: `app/profile/index.tsx` (moved from `app/(tabs)/profile/index.tsx`)
- Create: `app/profile/settings.tsx` (moved from `app/(tabs)/profile/settings.tsx`)
- Delete: `app/(tabs)/profile/`

- [ ] **Step 1: Move profile directory**

```bash
mv "app/(tabs)/profile" "app/profile"
```

- [ ] **Step 2: Update settings route in `app/profile/index.tsx`**

Find and replace in `app/profile/index.tsx`:

Old:
```tsx
router.push('/(drawer)/profile/settings')
```

New:
```tsx
router.push('/profile/settings')
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: move profile outside tabs to app/profile/"
```

---

## Task 6: Update map.tsx — remove drawer, add LocationSearch

**Files:**
- Modify: `app/(tabs)/map.tsx`

- [ ] **Step 1: Remove drawer imports and arrow button**

In `app/(tabs)/map.tsx`, remove these lines:
```tsx
import { useNavigation } from '@react-navigation/native'
import { DrawerActions } from '@react-navigation/native'
```

Remove this line in the component body:
```tsx
const navigation = useNavigation()
```

Remove the entire `{/* Drawer trigger — pinned to left edge */}` block:
```tsx
{/* Drawer trigger — pinned to left edge */}
<TouchableOpacity
  style={styles.drawerArrow}
  onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
  activeOpacity={0.7}
>
  <Text style={styles.drawerArrowIcon}>›</Text>
</TouchableOpacity>
```

Remove the `drawerArrow` and `drawerArrowIcon` style entries.

Also remove `TouchableOpacity` from the React Native import — it is only used by the drawer arrow block.

- [ ] **Step 2: Uncomment LocationSearch and add import**

Uncomment the import:
```tsx
import { LocationSearch } from '@/components/map/LocationSearch'
```

Replace the commented-out `<LocationSearch>` block:
```tsx
{/* <LocationSearch
  onSelect={(newRegion) => {
    ...
  }}
/> */}
```

With the active version:
```tsx
<LocationSearch
  onSelect={(newRegion) => {
    setRegion(newRegion)
    setQueryRegion(newRegion)
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'JUMP_TO',
      lat: newRegion.latitude,
      lng: newRegion.longitude,
      zoom: 13,
    }))
  }}
/>
```

- [ ] **Step 3: Wrap LocationSearch in a positioned container**

`LocationSearch.tsx` does not use `position: 'absolute'` internally — it must be wrapped. Replace the bare `<LocationSearch ... />` with:

```tsx
<View style={styles.searchWrapper}>
  <LocationSearch onSelect={...} />
</View>
```

```tsx
searchWrapper: {
  position: 'absolute',
  top: 100,
  left: 16,
  right: 16,
  zIndex: 50,
},
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/map.tsx"
git commit -m "feat: remove drawer arrow from map, uncomment LocationSearch"
```

---

## Task 7: Update all route references

**Files:**
- Modify: `app/index.tsx`
- Modify: `components/navigation/TopBar.tsx`

- [ ] **Step 1: Update `app/index.tsx` — 2 occurrences**

Old:
```tsx
router.replace('/(drawer)/map')
```

New:
```tsx
router.replace('/(tabs)/map')
```

Both occurrences (line ~18 in `useEffect`, line ~30 in GO button `onPress`).

- [ ] **Step 2: Update `TopBar.tsx` — profile route**

Old:
```tsx
router.push('/(drawer)/profile')
```

New:
```tsx
router.push('/profile')
```

- [ ] **Step 3: Scan for any remaining `/(drawer)/` references**

```bash
grep -r "/(drawer)/" app/ components/ hooks/ store/ --include="*.tsx" --include="*.ts"
```

Expected: no output. If any remain, fix them.

- [ ] **Step 4: Commit**

```bash
git add app/index.tsx components/navigation/TopBar.tsx
git commit -m "fix: update all route references from /(drawer)/ to /(tabs)/"
```

---

## Task 8: Verify and smoke test

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Run Jest**

```bash
npx jest --passWithNoTests
```

Expected: all tests pass, no references to deleted files.

- [ ] **Step 3: Start the app and verify manually**

```bash
npx expo start
```

Checklist:
- [ ] Welcome screen → GO button navigates to Map tab
- [ ] Bottom nav shows Map, Feed, Boards with correct Heroicons
- [ ] Active tab shows orange dot, inactive tabs are dim gray
- [ ] Map loads with Leaflet, embers visible
- [ ] LocationSearch bar appears below Embers logo on map
- [ ] Feed tab opens feed screen
- [ ] Boards tab opens stub screen
- [ ] Profile pill (top-right) navigates to `/profile`
- [ ] No drawer/sidebar anywhere
- [ ] Sign in button (guest) works from TopBar

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete bottom nav redesign (Map/Feed/Boards)"
```
