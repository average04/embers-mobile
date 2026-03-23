# Embers Mobile — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap `embers-mobile` as a working Expo app with auth (login, signup, magic link, setup-username), a tab navigation shell, Supabase client, Zustand stores, React Query, and a Jest test suite — ready for feature development.

**Architecture:** Expo Router v3 file-based routing; `app/_layout.tsx` gates all navigation based on Supabase session state stored in Zustand. Splash screen is held until auth state is resolved to prevent navigation flicker. All subsequent phases build on top of this shell.

**Tech Stack:** Expo SDK 52, React Native, TypeScript (strict), Expo Router v3, @supabase/supabase-js v2, @react-native-async-storage/async-storage, react-native-url-polyfill, Zustand 5, TanStack React Query v5, Jest + jest-expo + @testing-library/react-native

---

> **This is Phase 1 of 6.** Full plan sequence:
> - **Phase 1 (this plan):** Foundation — repo, auth, navigation shell, stores
> - Phase 2: Map & Ember Viewing — react-native-maps, markers, clustering, ember detail
> - Phase 3: Ember Creation — text/audio posts, photo upload, image crop
> - Phase 4: Feed & Social — feed, profiles, follows, reactions, comments, relights
> - Phase 5: Notifications & Push — in-app notifs, push_tokens table, Supabase Edge Function
> - Phase 6: Moderator, Settings & Deployment — mod panel, settings, deep links, EAS build
>
> Each phase produces a runnable slice of the app. Do not start Phase 2 until Phase 1 is fully working.

---

## File Map

**Created in this phase:**

```
embers-mobile/
├── app/
│   ├── _layout.tsx                    # Root layout: auth gate, SplashScreen, providers
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Bottom tab bar definition
│   │   ├── map.tsx                    # Placeholder: "Map coming in Phase 2"
│   │   ├── feed.tsx                   # Placeholder: "Feed coming in Phase 4"
│   │   ├── notifications.tsx          # Placeholder: "Notifications coming in Phase 5"
│   │   └── profile/
│   │       ├── index.tsx              # Placeholder: "Profile coming in Phase 4"
│   │       └── settings.tsx           # Placeholder: "Settings coming in Phase 6"
│   └── auth/
│       ├── _layout.tsx                # Auth stack layout (no tab bar)
│       ├── login.tsx                  # Email/password login + magic link
│       ├── signup.tsx                 # Email/password signup
│       └── setup-username.tsx         # Username pick (runs once after first login)
├── components/
│   └── ui/
│       ├── Button.tsx                 # Primary/secondary/destructive variants
│       ├── Input.tsx                  # Text input with label + error state
│       ├── LoadingScreen.tsx          # Full-screen spinner (shown during auth init)
│       └── TabIcons.tsx               # Placeholder tab bar icons (emoji, swap with vector icons later)
├── constants/
│   ├── emberTypes.ts                  # EMBER_TYPES array + type colors (mirrors web app)
│   └── validation.ts                  # MAX_EMBER_LENGTH, MAX_COMMENT_LENGTH, etc.
├── hooks/
│   └── useAuth.ts                     # signIn, signUp, signOut, sendMagicLink
├── lib/
│   ├── queryClient.ts                 # React Query client config
│   └── supabase/
│       ├── client.ts                  # Supabase client (AsyncStorage + URL polyfill)
│       └── types.ts                   # DB types (copied/generated from Supabase schema)
├── store/
│   ├── authStore.ts                   # session, profile, setSession, setProfile, clear
│   ├── mapStore.ts                    # region, selectedEmberId, setRegion, setSelected
│   └── notifStore.ts                  # unreadCount, increment, reset
├── __mocks__/
│   └── @supabase/
│       └── supabase-js.ts             # Jest mock for Supabase client
├── __tests__/
│   ├── store/
│   │   ├── authStore.test.ts
│   │   ├── mapStore.test.ts
│   │   └── notifStore.test.ts
│   ├── hooks/
│   │   └── useAuth.test.ts
│   └── components/
│       └── ui/
│           ├── Button.test.tsx
│           └── Input.test.tsx
├── .env.example
├── .gitignore
├── app.json
├── eas.json
├── babel.config.js
├── jest.config.js
├── tsconfig.json
└── package.json
```

---

## Task 1: Initialize the Expo project

**Files:**
- Create: `embers-mobile/` (project root)
- Create: `tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold the project**

Run in the directory *above* where you want `embers-mobile/`:
```bash
npx create-expo-app@latest embers-mobile --template default
cd embers-mobile
```

The `default` template includes Expo Router, TypeScript, and a basic tab layout. We will replace its placeholder content.

- [ ] **Step 2: Verify the project runs**

```bash
npx expo start
```

Expected: Metro bundler starts, QR code displayed. Press `Ctrl+C` to stop.

- [ ] **Step 3: Enable TypeScript strict mode**

Open `tsconfig.json` and replace its contents:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.d.ts",
    "expo-env.d.ts"
  ]
}
```

- [ ] **Step 4: Add path alias to babel config**

Replace `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: { '@': '.' },
        },
      ],
    ],
  }
}
```

- [ ] **Step 5: Install babel-plugin-module-resolver**

```bash
npm install --save-dev babel-plugin-module-resolver
```

- [ ] **Step 6: Delete template placeholder files**

The default template has placeholder tab screens. Remove them — we will create the correct structure:

```bash
rm -rf app/(tabs)/index.tsx app/(tabs)/explore.tsx app/+not-found.tsx
# Delete any other generated placeholder screens shown by the template
```

- [ ] **Step 7: Initialize git**

```bash
git init
git add .
git commit -m "chore: init expo project with strict typescript and path aliases"
```

---

## Task 2: Install all dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install production dependencies**

```bash
npm install \
  @supabase/supabase-js \
  @react-native-async-storage/async-storage \
  react-native-url-polyfill \
  zustand \
  @tanstack/react-query \
  expo-splash-screen \
  expo-font \
  expo-web-browser
```

- [ ] **Step 2: Install Phase 2+ dependencies now** (so app.json permissions are configured correctly from the start)

```bash
npm install \
  react-native-maps \
  react-native-map-clustering \
  supercluster \
  expo-location \
  expo-av \
  expo-image-picker \
  expo-image-manipulator \
  expo-notifications \
  react-native-svg
```

> **Note:** `supercluster` is the fallback for `react-native-map-clustering`. Install both now — if `react-native-map-clustering` fails to build with the current Expo SDK, switch to the `supercluster` + custom marker approach in Phase 2.

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev \
  @testing-library/react-native \
  @testing-library/jest-native \
  @types/supercluster \
  jest-expo
```

- [ ] **Step 4: Verify no peer dependency conflicts**

```bash
npm ls --depth=0 2>&1 | grep -i "peer\|conflict"
```

Expected: no peer dependency errors. If any appear, resolve them before continuing.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install all dependencies"
```

---

## Task 3: Configure app.json, eas.json, and Jest

**Files:**
- Modify: `app.json`
- Create: `eas.json`
- Create: `jest.config.js`

- [ ] **Step 1: Replace app.json**

```json
{
  "expo": {
    "name": "Embers",
    "slug": "embers-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "embers",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0f1117"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.embersthoughts.mobile",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Embers uses your location to show nearby thoughts on the map.",
        "NSMicrophoneUsageDescription": "Embers uses your microphone to record audio embers.",
        "NSPhotoLibraryUsageDescription": "Embers uses your photo library to attach images to embers."
      }
    },
    "android": {
      "package": "com.embersthoughts.mobile",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0f1117"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "RECORD_AUDIO",
        "READ_MEDIA_IMAGES",
        "POST_NOTIFICATIONS"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Embers uses your location to show nearby thoughts on the map."
        }
      ],
      [
        "expo-av",
        {
          "microphonePermission": "Embers uses your microphone to record audio embers."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Embers uses your photo library to attach images to embers."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#e94560",
          "sounds": []
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

> **Note:** Replace bundle identifiers `com.embersthoughts.mobile` with actual values once App Store Connect and Play Console are set up. The scheme `embers` enables `embers://` deep links.

> **Note:** Create placeholder PNG files for `notification-icon.png` if not yet available — EAS Build will fail without it. A simple 96x96 white icon suffices for now.

- [ ] **Step 2: Create eas.json**

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 3: Configure Jest**

Replace/create `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-maps|react-native-map-clustering)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'store/**/*.ts',
    'hooks/**/*.ts',
    'lib/**/*.ts',
    'constants/**/*.ts',
    '!**/*.d.ts',
  ],
}
```

> **Note:** The `transformIgnorePatterns` whitelist is critical for Jest with Expo — native modules that ship ESM must be transpiled. Add any new native packages to this list if you see "unexpected token" errors in tests.

- [ ] **Step 4: Add test script to package.json**

Open `package.json` and ensure scripts include:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

- [ ] **Step 5: Run Jest to verify setup**

```bash
npm test
```

Expected: "No tests found" or passing on any existing tests. Should not error.

- [ ] **Step 6: Commit**

```bash
git add app.json eas.json jest.config.js
git commit -m "chore: configure app.json permissions, EAS build profiles, and Jest"
```

---

## Task 4: Environment variables and Supabase client

**Files:**
- Create: `.env.example`
- Create: `.env.local` (not committed)
- Create: `lib/supabase/client.ts`

- [ ] **Step 1: Create .env.example**

```bash
# .env.example
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 2: Create your .env.local**

Copy `.env.example` to `.env.local` and fill in your actual Supabase project URL and anon key from the web app (they share the same Supabase project).

```bash
cp .env.example .env.local
```

- [ ] **Step 3: Verify .gitignore excludes .env.local**

Open `.gitignore` and confirm these lines exist:
```
.env.local
.env*.local
```

If not present, add them.

- [ ] **Step 4: Create the Supabase client**

Create `lib/supabase/client.ts`:

```ts
// The URL polyfill must be imported before @supabase/supabase-js
// Supabase uses the URL class internally; React Native does not have it natively
import 'react-native-url-polyfill/auto'

import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Database } from './types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env.local and fill in your values.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native — no browser URL to detect
  },
})
```

> **Why `detectSessionInUrl: false`:** In a browser, Supabase reads the auth token from the URL after OAuth redirects. React Native has no browser URL, so this must be disabled to prevent Supabase from throwing errors.

- [ ] **Step 5: Commit**

```bash
git add .env.example lib/supabase/client.ts .gitignore
git commit -m "feat: add Supabase client with AsyncStorage session persistence"
```

---

## Task 5: Database types

**Files:**
- Create: `lib/supabase/types.ts`

- [ ] **Step 1: Generate types from Supabase (preferred)**

If the Supabase CLI is installed:

```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  --schema public > lib/supabase/types.ts
```

Find `YOUR_PROJECT_ID` in your Supabase project URL: `https://YOUR_PROJECT_ID.supabase.co`.

- [ ] **Step 2: Alternative — copy from web app**

If the CLI is not set up, copy the types from the web app:

```bash
cp ../embers-web-app/app/lib/supabase/types.ts lib/supabase/types.ts
```

> **Important:** The mobile app and web app share the same database. Types must stay in sync. If you add new columns or tables in future migrations, regenerate types in both projects.

- [ ] **Step 3: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "feat: add Supabase database types"
```

---

## Task 6: Constants

**Files:**
- Create: `constants/emberTypes.ts`
- Create: `constants/validation.ts`

- [ ] **Step 1: Create ember types constant**

Create `constants/emberTypes.ts`:

```ts
export const EMBER_TYPES = [
  'hope',
  'ghost',
  'dreams',
  'vents',
  'wisps',
  'echoes',
  'shadows',
  'sparks',
  'hotdog',
  'hearts',
] as const

export type EmberType = typeof EMBER_TYPES[number]

// Color per ember type — matches web app styling
export const EMBER_TYPE_COLORS: Record<EmberType, string> = {
  hope: '#f7d354',
  ghost: '#a0aec0',
  dreams: '#9b8afb',
  vents: '#fc8181',
  wisps: '#76e4f7',
  echoes: '#68d391',
  shadows: '#718096',
  sparks: '#f6ad55',
  hotdog: '#e53e3e',
  hearts: '#f687b3',
}
```

> **Note:** Verify these colors match the web app's ember type colors. Check `app/constants/` in the web app repo.

- [ ] **Step 2: Create validation constants**

Create `constants/validation.ts`:

```ts
// Mirror the web app's validation limits exactly
export const MAX_EMBER_CONTENT_LENGTH = 500
export const MAX_COMMENT_LENGTH = 500
export const MAX_USERNAME_LENGTH = 30
export const MIN_USERNAME_LENGTH = 3
export const MAX_BLUE_EMBER_TITLE_LENGTH = 100
export const MIN_AUDIO_DURATION_SECONDS = 2
export const MAX_AUDIO_DURATION_SECONDS = 60
export const EMBER_RATE_LIMIT_SECONDS = 120 // 1 ember per 120s per user
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/
```

> **Note:** Cross-check these values against the web app's `app/constants/` — they must match exactly since both apps share the same database constraints and server-side validation.

- [ ] **Step 3: Commit**

```bash
git add constants/
git commit -m "feat: add ember type constants and validation limits"
```

---

## Task 7: Zustand stores

**Files:**
- Create: `store/authStore.ts`
- Create: `store/mapStore.ts`
- Create: `store/notifStore.ts`
- Create: `__tests__/store/authStore.test.ts`
- Create: `__tests__/store/mapStore.test.ts`
- Create: `__tests__/store/notifStore.test.ts`

- [ ] **Step 1: Write failing tests for authStore**

Create `__tests__/store/authStore.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react-native'
import { useAuthStore } from '@/store/authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, profile: null })
  })

  it('starts with null session and profile', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.session).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('setSession updates the session', () => {
    const { result } = renderHook(() => useAuthStore())
    const fakeSession = { user: { id: '123' } } as any
    act(() => result.current.setSession(fakeSession))
    expect(result.current.session).toEqual(fakeSession)
  })

  it('setProfile updates the profile', () => {
    const { result } = renderHook(() => useAuthStore())
    const fakeProfile = { id: '123', username: 'jay', is_moderator: false } as any
    act(() => result.current.setProfile(fakeProfile))
    expect(result.current.profile).toEqual(fakeProfile)
  })

  it('clear resets session and profile to null', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setSession({ user: { id: '123' } } as any)
      result.current.setProfile({ id: '123', username: 'jay' } as any)
    })
    act(() => result.current.clear())
    expect(result.current.session).toBeNull()
    expect(result.current.profile).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- authStore
```

Expected: FAIL — `authStore` module not found.

- [ ] **Step 3: Create authStore**

Create `store/authStore.ts`:

```ts
import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  session: Session | null
  profile: Profile | null
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  clear: () => set({ session: null, profile: null }),
}))
```

- [ ] **Step 4: Run authStore tests to verify they pass**

```bash
npm test -- authStore
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Write failing tests for mapStore**

Create `__tests__/store/mapStore.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react-native'
import { useMapStore } from '@/store/mapStore'

const DEFAULT_REGION = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

describe('mapStore', () => {
  beforeEach(() => {
    useMapStore.setState({ region: DEFAULT_REGION, selectedEmberId: null })
  })

  it('starts with default region and no selected ember', () => {
    const { result } = renderHook(() => useMapStore())
    expect(result.current.region).toEqual(DEFAULT_REGION)
    expect(result.current.selectedEmberId).toBeNull()
  })

  it('setRegion updates the region', () => {
    const { result } = renderHook(() => useMapStore())
    const newRegion = { latitude: 10, longitude: 10, latitudeDelta: 0.1, longitudeDelta: 0.1 }
    act(() => result.current.setRegion(newRegion))
    expect(result.current.region).toEqual(newRegion)
  })

  it('setSelectedEmberId updates selected ember', () => {
    const { result } = renderHook(() => useMapStore())
    act(() => result.current.setSelectedEmberId('ember-123'))
    expect(result.current.selectedEmberId).toBe('ember-123')
  })

  it('setSelectedEmberId can clear selection', () => {
    const { result } = renderHook(() => useMapStore())
    act(() => result.current.setSelectedEmberId('ember-123'))
    act(() => result.current.setSelectedEmberId(null))
    expect(result.current.selectedEmberId).toBeNull()
  })
})
```

- [ ] **Step 6: Create mapStore**

Create `store/mapStore.ts`:

```ts
import { create } from 'zustand'

interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

// Default region: Manila, Philippines (adjust to your primary market)
const DEFAULT_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

interface MapState {
  region: Region
  selectedEmberId: string | null
  setRegion: (region: Region) => void
  setSelectedEmberId: (id: string | null) => void
}

export const useMapStore = create<MapState>((set) => ({
  region: DEFAULT_REGION,
  selectedEmberId: null,
  setRegion: (region) => set({ region }),
  setSelectedEmberId: (selectedEmberId) => set({ selectedEmberId }),
}))
```

- [ ] **Step 7: Write and implement notifStore**

Create `__tests__/store/notifStore.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react-native'
import { useNotifStore } from '@/store/notifStore'

describe('notifStore', () => {
  beforeEach(() => {
    useNotifStore.setState({ unreadCount: 0 })
  })

  it('starts at zero', () => {
    const { result } = renderHook(() => useNotifStore())
    expect(result.current.unreadCount).toBe(0)
  })

  it('increment increases count by 1', () => {
    const { result } = renderHook(() => useNotifStore())
    act(() => result.current.increment())
    act(() => result.current.increment())
    expect(result.current.unreadCount).toBe(2)
  })

  it('reset sets count to 0', () => {
    const { result } = renderHook(() => useNotifStore())
    act(() => result.current.increment())
    act(() => result.current.increment())
    act(() => result.current.reset())
    expect(result.current.unreadCount).toBe(0)
  })
})
```

Create `store/notifStore.ts`:

```ts
import { create } from 'zustand'

interface NotifState {
  unreadCount: number
  increment: () => void
  reset: () => void
}

export const useNotifStore = create<NotifState>((set) => ({
  unreadCount: 0,
  increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
}))
```

- [ ] **Step 8: Run all store tests**

```bash
npm test -- --testPathPattern="store"
```

Expected: PASS — all store tests pass.

- [ ] **Step 9: Commit**

```bash
git add store/ __tests__/store/
git commit -m "feat: add Zustand stores (auth, map, notif) with tests"
```

---

## Task 8: React Query provider

**Files:**
- Create: `lib/queryClient.ts`

- [ ] **Step 1: Create the query client**

Create `lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // Consider data fresh for 1 minute
      gcTime: 5 * 60 * 1000,     // Keep unused data in cache for 5 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
    mutations: {
      retry: 0, // Mutations should not auto-retry — let the user decide
    },
  },
})
```

> The provider is added to `app/_layout.tsx` in Task 10 alongside the root layout setup.

- [ ] **Step 2: Commit**

```bash
git add lib/queryClient.ts
git commit -m "feat: configure React Query client with sensible defaults"
```

---

## Task 9: useAuth hook

**Files:**
- Create: `hooks/useAuth.ts`
- Create: `__mocks__/@supabase/supabase-js.ts`
- Create: `__tests__/hooks/useAuth.test.ts`

- [ ] **Step 1: Create the Supabase mock**

Create `__mocks__/@supabase/supabase-js.ts`:

```ts
export const createClient = jest.fn(() => ({
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    signInWithOtp: jest.fn(),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnThis(),
  }),
}))
```

- [ ] **Step 2: Write failing tests for useAuth**

Create `__tests__/hooks/useAuth.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react-native'
import { useAuth } from '@/hooks/useAuth'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOtp: jest.fn(),
    },
  },
}))

// Mock auth store
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn().mockReturnValue({
    clear: jest.fn(),
  }),
}))

import { supabase } from '@/lib/supabase/client'

describe('useAuth', () => {
  beforeEach(() => jest.clearAllMocks())

  it('signIn calls supabase signInWithPassword', async () => {
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { session: { user: { id: '1' } } },
      error: null,
    })
    const { result } = renderHook(() => useAuth())
    const { error } = await act(() => result.current.signIn('test@test.com', 'password'))
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password',
    })
    expect(error).toBeNull()
  })

  it('signIn returns error on failure', async () => {
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Invalid credentials' },
    })
    const { result } = renderHook(() => useAuth())
    const { error } = await act(() => result.current.signIn('test@test.com', 'wrong'))
    expect(error).toBe('Invalid credentials')
  })

  it('signOut calls supabase signOut and clears store', async () => {
    ;(supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({ error: null })
    const { result } = renderHook(() => useAuth())
    await act(() => result.current.signOut())
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('sendMagicLink calls signInWithOtp', async () => {
    ;(supabase.auth.signInWithOtp as jest.Mock).mockResolvedValueOnce({ error: null })
    const { result } = renderHook(() => useAuth())
    const { error } = await act(() => result.current.sendMagicLink('test@test.com'))
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'test@test.com' })
    expect(error).toBeNull()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test -- useAuth
```

Expected: FAIL — `useAuth` module not found.

- [ ] **Step 4: Implement useAuth**

Create `hooks/useAuth.ts`:

```ts
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { clear } = useAuthStore()

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    clear()
  }

  async function sendMagicLink(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error: error?.message ?? null }
  }

  return { signIn, signUp, signOut, sendMagicLink }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- useAuth
```

Expected: PASS — 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add hooks/useAuth.ts __tests__/hooks/useAuth.test.ts __mocks__/
git commit -m "feat: add useAuth hook with sign in, sign up, sign out, magic link"
```

---

## Task 10: Shared UI components

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/LoadingScreen.tsx`
- Create: `__tests__/components/ui/Button.test.tsx`
- Create: `__tests__/components/ui/Input.test.tsx`

- [ ] **Step 1: Write failing tests for Button**

Create `__tests__/components/ui/Button.test.tsx`:

```tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders the label', () => {
    const { getByText } = render(<Button label="Press me" onPress={() => {}} />)
    expect(getByText('Press me')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Tap" onPress={onPress} />)
    fireEvent.press(getByText('Tap'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Button label="Tap" onPress={onPress} disabled />)
    fireEvent.press(getByText('Tap'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows loading indicator when loading=true', () => {
    const { getByTestId } = render(<Button label="Save" onPress={() => {}} loading />)
    expect(getByTestId('button-loading')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- Button
```

Expected: FAIL.

- [ ] **Step 3: Implement Button**

Create `components/ui/Button.tsx`:

```tsx
import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native'

interface ButtonProps extends TouchableOpacityProps {
  label: string
  variant?: 'primary' | 'secondary' | 'destructive'
  loading?: boolean
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          testID="button-loading"
          size="small"
          color={variant === 'primary' ? '#fff' : '#e94560'}
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primary: { backgroundColor: '#e94560' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e94560' },
  destructive: { backgroundColor: '#7f1d1d' },
  disabled: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '600' },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: '#e94560' },
  destructiveLabel: { color: '#fca5a5' },
})
```

- [ ] **Step 4: Write and implement Input**

Create `__tests__/components/ui/Input.test.tsx`:

```tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders the label', () => {
    const { getByText } = render(<Input label="Email" value="" onChangeText={() => {}} />)
    expect(getByText('Email')).toBeTruthy()
  })

  it('shows error message when provided', () => {
    const { getByText } = render(
      <Input label="Email" value="" onChangeText={() => {}} error="Invalid email" />
    )
    expect(getByText('Invalid email')).toBeTruthy()
  })

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn()
    const { getByDisplayValue } = render(
      <Input label="Email" value="a" onChangeText={onChangeText} />
    )
    fireEvent.changeText(getByDisplayValue('a'), 'ab')
    expect(onChangeText).toHaveBeenCalledWith('ab')
  })
})
```

Create `components/ui/Input.tsx`:

```tsx
import React from 'react'
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label: string
  error?: string
}

export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor="#4a5568"
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, color: '#a0aec0', marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d3748',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f7fafc',
  },
  inputError: { borderColor: '#fc8181' },
  error: { fontSize: 12, color: '#fc8181', marginTop: 4 },
})
```

Create `components/ui/LoadingScreen.tsx`:

```tsx
import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e94560" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
```

- [ ] **Step 5: Run all UI component tests**

```bash
npm test -- --testPathPattern="components/ui"
```

Expected: PASS — all Button and Input tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/ui/ __tests__/components/
git commit -m "feat: add Button, Input, and LoadingScreen UI components with tests"
```

---

## Task 11: Auth screens

**Files:**
- Create: `app/auth/_layout.tsx`
- Create: `app/auth/login.tsx`
- Create: `app/auth/signup.tsx`
- Create: `app/auth/setup-username.tsx`

- [ ] **Step 1: Create auth stack layout**

Create `app/auth/_layout.tsx`:

```tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f1117' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="setup-username" />
    </Stack>
  )
}
```

- [ ] **Step 2: Create Login screen**

Create `app/auth/login.tsx`:

```tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn, sendMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email'
    if (!password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSignIn() {
    if (!validate()) return
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) {
      Alert.alert('Login failed', error)
    }
    // Navigation is handled by the auth gate in _layout.tsx
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email to receive a magic link' })
      return
    }
    setMagicLinkLoading(true)
    const { error } = await sendMagicLink(email.trim())
    setMagicLinkLoading(false)
    if (error) {
      Alert.alert('Error', error)
    } else {
      Alert.alert('Check your email', 'A magic link has been sent to ' + email.trim())
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>embers</Text>
        <Text style={styles.tagline}>thoughts left on the map</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            error={errors.password}
          />
          <Button label="Sign in" onPress={handleSignIn} loading={loading} />
          <Button
            label="Send magic link"
            variant="secondary"
            onPress={handleMagicLink}
            loading={magicLinkLoading}
            style={styles.secondaryButton}
          />
        </View>

        <TouchableOpacity onPress={() => router.push('/auth/signup')} style={styles.switchLink}>
          <Text style={styles.switchText}>
            Don't have an account? <Text style={styles.switchAction}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f1117' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 42, fontWeight: '800', color: '#e94560', textAlign: 'center', marginBottom: 4 },
  tagline: { fontSize: 14, color: '#4a5568', textAlign: 'center', marginBottom: 48 },
  form: { gap: 0 },
  secondaryButton: { marginTop: 12 },
  switchLink: { marginTop: 32, alignItems: 'center' },
  switchText: { color: '#718096', fontSize: 14 },
  switchAction: { color: '#e94560', fontWeight: '600' },
})
```

- [ ] **Step 3: Create Signup screen**

Create `app/auth/signup.tsx`:

```tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function SignupScreen() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({})

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword) newErrors.confirm = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSignUp() {
    if (!validate()) return
    setLoading(true)
    const { error } = await signUp(email.trim(), password)
    setLoading(false)
    if (error) {
      Alert.alert('Signup failed', error)
    } else {
      Alert.alert(
        'Check your email',
        'A confirmation email has been sent. Click the link to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      )
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>embers</Text>
        <Text style={styles.heading}>Create account</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            error={errors.password}
          />
          <Input
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirm}
          />
          <Button label="Create account" onPress={handleSignUp} loading={loading} />
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.switchLink}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchAction}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f1117' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 42, fontWeight: '800', color: '#e94560', textAlign: 'center', marginBottom: 4 },
  heading: { fontSize: 20, color: '#a0aec0', textAlign: 'center', marginBottom: 48 },
  form: { gap: 0 },
  switchLink: { marginTop: 32, alignItems: 'center' },
  switchText: { color: '#718096', fontSize: 14 },
  switchAction: { color: '#e94560', fontWeight: '600' },
})
```

- [ ] **Step 4: Create Setup Username screen**

Create `app/auth/setup-username.tsx`:

```tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import {
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  USERNAME_REGEX,
} from '@/constants/validation'

export default function SetupUsernameScreen() {
  const { session, setProfile } = useAuthStore()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(): boolean {
    if (!username.trim()) { setError('Username is required'); return false }
    if (username.length < MIN_USERNAME_LENGTH) {
      setError(`Username must be at least ${MIN_USERNAME_LENGTH} characters`)
      return false
    }
    if (username.length > MAX_USERNAME_LENGTH) {
      setError(`Username must be ${MAX_USERNAME_LENGTH} characters or less`)
      return false
    }
    if (!USERNAME_REGEX.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return false
    }
    setError(null)
    return true
  }

  async function handleSave() {
    if (!validate() || !session) return
    setLoading(true)

    // Check if username is taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .single()

    if (existing) {
      setError('This username is already taken')
      setLoading(false)
      return
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', session.user.id)
      .select()
      .single()

    setLoading(false)

    if (updateError) {
      Alert.alert('Error', updateError.message)
      return
    }

    // Update store — auth gate will navigate to tabs automatically
    setProfile(updatedProfile)
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.logo}>embers</Text>
        <Text style={styles.heading}>Choose a username</Text>
        <Text style={styles.subheading}>
          This is how others will see you on the map.
        </Text>

        <Input
          label="Username"
          value={username}
          onChangeText={(text) => { setUsername(text); setError(null) }}
          autoCapitalize="none"
          autoCorrect={false}
          error={error ?? undefined}
          placeholder="e.g. jayrb"
        />
        <Button label="Save username" onPress={handleSave} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f1117' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 42, fontWeight: '800', color: '#e94560', textAlign: 'center', marginBottom: 4 },
  heading: { fontSize: 24, color: '#f7fafc', textAlign: 'center', marginBottom: 8, fontWeight: '700' },
  subheading: { fontSize: 14, color: '#718096', textAlign: 'center', marginBottom: 40 },
})
```

- [ ] **Step 5: Commit**

```bash
git add app/auth/
git commit -m "feat: add login, signup, and setup-username auth screens"
```

---

## Task 12: Root layout and auth gate

**Files:**
- Create: `app/_layout.tsx`

- [ ] **Step 1: Create the root layout**

Create `app/_layout.tsx`:

```tsx
import React, { useEffect, useState } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'

// Hold the splash screen until we know the auth state
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [initialized, setInitialized] = useState(false)
  const { session, profile, setSession, setProfile, clear } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  // Subscribe to Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)

        if (newSession) {
          // Fetch the user's profile on login
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single()
          setProfile(data)
        } else {
          // Clear profile on logout
          clear()
        }

        // Auth state is now known — we can safely navigate
        setInitialized(true)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Navigate based on auth state once initialized
  useEffect(() => {
    if (!initialized) return

    SplashScreen.hideAsync()

    const inAuthGroup = segments[0] === 'auth'

    if (!session) {
      // Not logged in → go to login
      if (!inAuthGroup) router.replace('/auth/login')
    } else if (!profile?.username) {
      // Logged in but no username yet → go to setup
      if (segments[1] !== 'setup-username') router.replace('/auth/setup-username')
    } else if (inAuthGroup) {
      // Logged in with username but still on auth screen → go to app
      router.replace('/(tabs)/map')
    }
  }, [initialized, session, profile])

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  )
}
```

> **Why this pattern:**
> - `SplashScreen.preventAutoHideAsync()` at module level prevents any navigation flash before auth is resolved.
> - `onAuthStateChange` fires once immediately with the current session from AsyncStorage, then again on login/logout. We use this single subscription as our source of truth.
> - We only start navigating after `initialized` is `true` — this prevents the flicker where a logged-in user briefly sees the login screen.
> - `SplashScreen.hideAsync()` is called inside the `initialized` effect so the splash screen is visible until navigation is determined.

- [ ] **Step 2: Verify auth gate works**

Start the dev server and test manually:

```bash
npx expo start
```

- Open on device/simulator with no stored session → should land on Login screen
- Sign in with a valid account → should navigate to tabs (map placeholder)
- Kill and reopen the app while logged in → should skip login and go directly to tabs
- Sign in with a new account (no username) → should land on Setup Username screen

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx lib/queryClient.ts
git commit -m "feat: add root layout with auth gate and splash screen handling"
```

---

## Task 13: Tab shell

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/map.tsx`
- Create: `app/(tabs)/feed.tsx`
- Create: `app/(tabs)/notifications.tsx`
- Create: `app/(tabs)/profile/index.tsx`
- Create: `app/(tabs)/profile/settings.tsx`

- [ ] **Step 1: Create the tab bar layout**

Create `app/(tabs)/_layout.tsx`:

```tsx
import React from 'react'
import { Tabs } from 'expo-router'
import { MapIcon, FeedIcon, BellIcon, UserIcon } from '@/components/ui/TabIcons'
import { useNotifStore } from '@/store/notifStore'

export default function TabLayout() {
  const unreadCount = useNotifStore((s) => s.unreadCount)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f1117',
          borderTopColor: '#1a1a2e',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#4a5568',
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <FeedIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => <BellIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
```

- [ ] **Step 2: Create tab icon components**

Create `components/ui/TabIcons.tsx`:

```tsx
import React from 'react'
import { Text } from 'react-native'

// Using text emoji icons as placeholders.
// Replace with react-native-vector-icons or expo/vector-icons in a polish pass.
interface IconProps { color: string; size: number }

export const MapIcon = ({ color }: IconProps) => <Text style={{ fontSize: 20, color }}>🗺️</Text>
export const FeedIcon = ({ color }: IconProps) => <Text style={{ fontSize: 20, color }}>📰</Text>
export const BellIcon = ({ color }: IconProps) => <Text style={{ fontSize: 20, color }}>🔔</Text>
export const UserIcon = ({ color }: IconProps) => <Text style={{ fontSize: 20, color }}>👤</Text>
```

> **Note:** These are placeholder emoji icons for Phase 1. Swap them for proper vector icons (e.g., `@expo/vector-icons` which ships with Expo) in a polish pass — just replace the icon components without touching any other file.

- [ ] **Step 3: Create placeholder tab screens**

Create `app/(tabs)/map.tsx`:

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map</Text>
      <Text style={styles.sub}>Coming in Phase 2</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, color: '#e94560', fontWeight: '700' },
  sub: { fontSize: 14, color: '#4a5568', marginTop: 8 },
})
```

Create `app/(tabs)/feed.tsx`:

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Feed</Text>
      <Text style={styles.sub}>Coming in Phase 4</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, color: '#e94560', fontWeight: '700' },
  sub: { fontSize: 14, color: '#4a5568', marginTop: 8 },
})
```

Create `app/(tabs)/notifications.tsx`:

```tsx
import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useNotifStore } from '@/store/notifStore'

export default function NotificationsScreen() {
  const reset = useNotifStore((s) => s.reset)

  // Reset badge when user visits the tab
  useEffect(() => {
    reset()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Notifications</Text>
      <Text style={styles.sub}>Coming in Phase 5</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, color: '#e94560', fontWeight: '700' },
  sub: { fontSize: 14, color: '#4a5568', marginTop: 8 },
})
```

Create `app/(tabs)/profile/index.tsx`:

```tsx
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'

export default function ProfileScreen() {
  const router = useRouter()
  const { signOut } = useAuth()
  const profile = useAuthStore((s) => s.profile)

  return (
    <View style={styles.container}>
      <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
      <Text style={styles.sub}>Profile coming in Phase 4</Text>

      <TouchableOpacity onPress={() => router.push('/(tabs)/profile/settings')} style={styles.link}>
        <Text style={styles.linkText}>Settings →</Text>
      </TouchableOpacity>

      <Button label="Sign out" variant="secondary" onPress={signOut} style={styles.signout} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center', padding: 24 },
  username: { fontSize: 24, color: '#f7fafc', fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: 14, color: '#4a5568', marginBottom: 32 },
  link: { marginBottom: 32 },
  linkText: { color: '#e94560', fontSize: 16 },
  signout: { width: '100%' },
})
```

Create `app/(tabs)/profile/settings.tsx`:

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
      <Text style={styles.sub}>Coming in Phase 6</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, color: '#e94560', fontWeight: '700' },
  sub: { fontSize: 14, color: '#4a5568', marginTop: 8 },
})
```

- [ ] **Step 4: Verify the full flow manually**

```bash
npx expo start
```

Walk through the complete auth flow:
1. Fresh start → Login screen
2. Sign up → email confirmation (check email)
3. Log in → Setup Username (if new account)
4. Set username → Tab bar appears with Map/Feed/Notifications/Profile
5. Navigate all 4 tabs
6. Tap Settings → Settings placeholder screen
7. Tap Sign out → Login screen
8. Kill app, reopen while logged in → directly to tabs (no login screen)

All 8 steps should work without errors.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Final commit**

```bash
git add app/(tabs)/ components/ui/TabIcons.tsx
git commit -m "feat: add tab shell with map, feed, notifications, profile placeholders"
```

---

## Phase 1 Complete ✓

At this point you have:
- A working Expo app with correct TypeScript config
- Supabase client with AsyncStorage session persistence
- Auth flow: login, signup, magic link, setup username, sign out
- Auth gate that handles navigation without flicker
- Bottom tab bar (Map, Feed, Notifications, Profile)
- Badge count on Notifications tab (wired to notifStore)
- Zustand stores tested
- useAuth hook tested
- UI components (Button, Input) tested
- Jest configured and passing

**Next: Phase 2 — Map & Ember Viewing**

The plan for Phase 2 will be written when you are ready to start it. It covers:
- `react-native-maps` full-screen map
- Fetching embers within the current viewport from Supabase
- Custom `<EmberMarker>` components (color-coded per type)
- `react-native-map-clustering` integration (with supercluster fallback validation)
- Location search via Nominatim
- Ember detail bottom sheet
- Real-time viewport subscription (`embers` INSERT/DELETE)
