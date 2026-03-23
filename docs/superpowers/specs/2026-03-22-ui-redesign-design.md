# Embers Mobile — UI Redesign Design Spec

**Date:** 2026-03-22
**Scope:** Full visual pass — welcome screen, auth screens, navigation, guest flow
**Status:** Approved by user

---

## 1. Design Direction

**Theme:** Midnight Premium
- Background: `#080808` (near-black, deeper than current `#0f1117`)
- Accent: `#e94560` (kept — used sparingly: notification badges, buttons, decorative rule)
- Text primary: `#ffffff`
- Text secondary: `#4a4a5a`
- Border/divider: `#1a1a1a`
- Card/panel surface: `#0d0d0d`

**Typography:**
- **Logo/branding:** Cormorant Garamond, weight 300 (Light), loaded via `@expo-google-fonts/cormorant-garamond` + `expo-font`
- **UI elements:** System font (existing)
- **Logo size:** 48px, letterSpacing 2
- **Tagline:** 12px, italic, `#4a4a5a`

**Principles:** Minimalist, elegant. No filled highlight states on nav items. No colored backgrounds on active items. Restraint over decoration.

---

## 2. Packages to Install

```bash
npx expo install @react-navigation/drawer react-native-reanimated
npx expo install @expo-google-fonts/cormorant-garamond expo-font
```

**Notes:**
- `react-native-gesture-handler` is already installed (v2.28.0)
- `react-native-reanimated` is already installed (~4.1.1) — required by drawer v7 at runtime
- **Add** `react-native-reanimated/plugin` to `babel.config.js` — it is NOT currently present. The plugin must be the last entry in the plugins array:
  ```js
  // babel.config.js
  module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        ['module-resolver', { ... }], // existing
        'react-native-reanimated/plugin', // ADD THIS — must be last
      ],
    };
  };
  ```
  Without this the drawer will crash at runtime with a cryptic JS error.

---

## 3. Welcome Screen

**Route:** `app/index.tsx`

**Authenticated user handling:** On mount, check auth state. If user has a valid Supabase session, immediately redirect to `/(drawer)/map` — skip the welcome screen entirely. If not authenticated, show the welcome screen. This check uses the existing `useAuthStore` session value.

**Layout:** Full screen, vertically centered
- "Embers" — Cormorant Garamond Light 300, 48px, white, letterSpacing 2
- Tagline: "where you can light your thoughts" — 12px, italic, `#4a4a5a`, marginTop 8
- `GO` pill button — marginTop 48
  - `borderRadius: 50`, background `#1a1a1a`, border `1px solid #2a2a2a`
  - Text: "GO", 13px, weight 500, white, letterSpacing 2
  - Padding: 14px vertical, 40px horizontal
  - Note: use `borderRadius: 50` (number), not `'50%'` — React Native does not support percentage border-radius

**Behaviour:** GO → navigates to `/(drawer)/map`. No auth required.

**Splash screen:** The native splash screen is hidden immediately when the welcome screen mounts (no `preventAutoHideAsync` call — expo-router handles this automatically).

---

## 4. Auth Screens

**Shared layout (Login, Signup, Setup Username, Forgot Password):**

All auth screens use the same two-section layout:
- **Top hero (flex: 1):** Logo + tagline centered vertically
  - Below tagline: decorative rule — `width: 28, height: 1, backgroundColor: '#e94560', opacity: 0.5, marginTop: 16` (28px wide, 1px tall — horizontal accent line, not full-width)
- **Bottom form panel:** `backgroundColor: '#0d0d0d'`, `borderRadius: 20 20 0 0`, `borderTopWidth: 1, borderTopColor: '#161616'`, padding 24px

**Keyboard handling:** Wrap each auth screen in `KeyboardAvoidingView` with `behavior='padding'` on iOS and `behavior='height'` on Android. The form panel scrolls up to avoid the keyboard.

**Field labels:** 10px, uppercase, letterSpacing 1, `#3a3a4a`

**Input fields:** background `#111`, border `1px solid #1a1a1a`, borderRadius 8, padding 12px, fontSize 13, placeholder color `#444`

### Login (`app/auth/login.tsx`)
Form panel:
- Email input
- Password input
- "Forgot password?" — right-aligned, 11px, `#e94560`, navigates to `app/auth/forgot-password.tsx`
- "Sign in" primary button (marginTop 16)
- "Don't have an account? Sign up" — centered, 11px, dim text / `#e94560` accent

**Removed:** Magic link / Send magic link button — replaced by Forgot password

### Signup (`app/auth/signup.tsx`)
Form panel:
- Email input
- Password input
- Confirm Password input
- "Create account" primary button
- "Already have an account? Sign in" link

### Setup Username (`app/auth/setup-username.tsx`)
Form panel:
- Heading: "Choose your username" — 15px, weight 600, white
- Subtext: "How others will see you on the map" — 12px, `#3a3a4a`, marginBottom 16
- Username input
- "Save username" primary button

### Forgot Password (`app/auth/forgot-password.tsx`) — new screen
Form panel:
- Heading: "Reset password" — 15px, weight 600, white
- Subtext: "Enter your email and we'll send a reset link" — 12px, `#3a3a4a`, marginBottom 16
- Email input
- "Send reset link" primary button
- "Back to sign in" link — centered, 11px, `#3a3a4a`

Supabase method: `supabase.auth.resetPasswordForEmail(email)`

---

## 5. Navigation — Sidebar Drawer

**Replaces:** `app/(tabs)/` bottom tab navigator
**New group:** `app/(drawer)/` — contains map, feed, notifications, and links to profile

**Package:** `@react-navigation/drawer` with `drawerType: 'front'` — sidebar slides over the content, content behind dims with `rgba(0,0,0,0.5)` overlay.

### Top Bar (`components/navigation/TopBar.tsx`)
Persistent, transparent, overlays all drawer screens. Always visible.

- **Left — Hamburger/Close button:**
  - 34×34px, `rgba(0,0,0,0.55)` background, border `1px solid #222`, borderRadius 8
  - Shows ☰ (three 13px lines, `#aaa`) when sidebar closed
  - Shows ✕ when sidebar open
  - Tapping toggles drawer open/closed via `navigation.openDrawer()` / `navigation.closeDrawer()`

- **Right — Profile pill:**
  - Background `rgba(0,0,0,0.55)`, borderRadius 20, border `1px solid #222`, padding `5px 10px 5px 5px`
  - **Authenticated:** 22×22px avatar circle + `@username` (11px, `#aaa`)
  - **Guest (not logged in):** Generic person icon (22×22px, `#3a3a4a`) + "Sign in" label (11px, `#3a3a4a`)
  - Tapping when authenticated → navigates to `/(drawer)/profile`
  - Tapping when guest → full-screen push to `app/auth/login.tsx`

### Drawer Content (`components/navigation/DrawerContent.tsx`)
Custom drawer replacing the default React Navigation drawer UI.

- Background: `#080808`
- Border-right: `1px solid #141414`
- No logo or tagline inside the sidebar

**Navigation items:** Map, Feed, Alerts
- Layout: flex row, gap 10, padding `10px 8px`
- Active indicator: 4×4px white circle dot (visible)
- Inactive: dot transparent (hidden), text `#3a3a4a`, weight 400
- Text: 11px, weight 600 (active) / 400 (inactive), letterSpacing 1.5, uppercase

**Alerts badge:** Small `#e94560` circle with unread count, right-aligned on Alerts row. Hidden if count is 0.

**Bottom:** "Sign out" text — 10px, `#252525`, uppercase, letterSpacing 1
- On tap: show confirmation Alert ("Sign out?", Cancel / Sign out)
- On confirm: call `supabase.auth.signOut()`, clear auth store, navigate to `app/index.tsx` (welcome screen)

### Profile screen
`app/(drawer)/profile/` — retained as-is, accessible via profile pill in TopBar. Not in sidebar nav items.

---

## 6. Auth Gate — `app/_layout.tsx`

**Keep:** The `onAuthStateChange` Supabase listener — session and profile state still need to be populated for the TopBar profile pill.

**Remove:** The redirect `useEffect` that forces unauthenticated users to `/auth/login`. Navigation is now open to all users.

**Keep:** The `initialized` state — used to ensure session is resolved before rendering (prevents flash of guest state for authenticated users).

**Result:** `_layout.tsx` populates auth state but does not gate navigation. The welcome screen (`app/index.tsx`) handles the authenticated-user redirect to the map.

---

## 7. Route Changes

The group rename from `(tabs)` to `(drawer)` affects all internal navigation calls. Update every occurrence:

| Old | New |
|---|---|
| `/(tabs)/map` | `/(drawer)/map` |
| `/(tabs)/feed` | `/(drawer)/feed` |
| `/(tabs)/notifications` | `/(drawer)/notifications` |
| `/(tabs)/profile` | `/(drawer)/profile` |

Search codebase for `(tabs)` and replace all.

---

## 8. Files Changed

**New:**
- `app/auth/forgot-password.tsx`
- `components/navigation/TopBar.tsx`
- `components/navigation/DrawerContent.tsx`

**Renamed/restructured:**
- `app/(tabs)/` → `app/(drawer)/` (rename directory, update layout file)

**Modified:**
- `app/_layout.tsx` — remove redirect gate, keep auth listener
- `app/index.tsx` — welcome screen (replaces redirect stub)
- `app/auth/login.tsx` — new layout, forgot password link, remove magic link
- `app/auth/signup.tsx` — new layout
- `app/auth/setup-username.tsx` — new layout
- `babel.config.js` — confirm reanimated plugin registered
- `app/(drawer)/_layout.tsx` — drawer navigator replacing tab navigator

---

## 9. Out of Scope (this phase)

- Ember detail sheet redesign
- Feed screen design
- Profile screen design
- Notifications screen design
- Map overlay redesign (search bar, loading badge)

These follow the same design direction (midnight premium, minimalist) and will be addressed in subsequent phases.
