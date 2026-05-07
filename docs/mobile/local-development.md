# Mobile Local Development Guide

This is the definitive guide for running the Tabletop mobile app (Expo React Native) in the iOS Simulator and Android Emulator on macOS. You should be able to go from zero to running the app in under 30 minutes.

---

## Prerequisites

- **macOS** (required for iOS Simulator; Android Emulator runs on macOS too)
- **Node.js 18+ and npm** (install via `nvm` or https://nodejs.org)
- **Xcode** (from Mac App Store, ~10GB — needed for iOS Simulator)
- **Android Studio** (for Android Emulator; https://developer.android.com/studio)
- **Docker Desktop** (only for local mock backend dependencies — Postgres + Redis)
- **Fly.io CLI** (optional — only if you want to target a staging backend)

> **Tip:** Run `xcode-select --install` first if you don't have the Xcode command-line tools.

---

## Quick Start (5 minutes)

For experienced developers who already have all prerequisites installed:

```bash
# 1. Start the local backend against staging services
cp .env.staging.example .env.staging
# Fill in staging keys and service URLs, then:
./dev.sh

# 2. In a new terminal, start the mobile app
cd mobile
cp .env.example .env && npx expo start

# 3. Press 'i' for iOS Simulator or 'a' for Android Emulator
```

If the app doesn't connect to the backend, check `EXPO_PUBLIC_API_URL` in `mobile/.env` — see [Switching Between Backend Targets](#7-switching-between-backend-targets).

---

## 1. Clone and Install

```bash
git clone <repo-url> tabletop
cd tabletop

# Install all workspace dependencies (frontend, mobile, shared)
npm install
```

This is an npm workspaces monorepo. `npm install` at the root installs dependencies for `frontend/`, `mobile/`, and `packages/shared/` in one shot. The `@tabletop/shared` package is symlinked into both apps via workspace resolution.

---

## 2. Backend Setup

The mobile app needs a running Go backend. You have three options.

### Option A: Local Backend Against Staging Services (default)

Uses real Clerk auth and staging service dependencies.

```bash
cp .env.staging.example .env.staging
# Fill in staging Clerk, DATABASE_URL, REDIS_URL, OMDb, and OpenAI values.
./dev.sh
```

The backend starts at `http://localhost:8080`, but it connects to staging Postgres/Redis from `.env.staging`. The mobile app shows real sign-in/sign-up screens and the backend verifies real Clerk JWTs.

### Option B: Local Backend with Mock Auth

Uses fake auth — no Clerk/OMDb/OpenAI keys needed.

```bash
# Copy the dev env template (it already has DEV_SKIP_AUTH=true)
cp .env.dev.example .env.dev

# Start Docker infra + backend
./dev.sh .env.dev --mock-auth
```

The backend starts at `http://localhost:8080`. Auth is bypassed — the app signs in automatically with a fake user. This is perfect for UI/UX development. OMDb search and AI chat won't work (no real keys), but all CRUD operations and instance management will.

### Option C: Local Backend with Real Auth and Local DB

Full-feature testing with real Clerk, OMDb, and OpenAI keys.

1. Copy and edit the dev env:

   ```bash
   cp .env.dev.example .env.dev
   ```

2. Open `.env.dev` and set:

   ```
   DEV_SKIP_AUTH=false
   CLERK_SECRET_KEY=sk_test_...       # From Clerk Dashboard
   CLERK_PUBLISHABLE_KEY=pk_test_...  # From Clerk Dashboard
   OMDB_API_KEY=...                   # From OMDb
   OPENAI_API_KEY=sk-...              # From OpenAI
   ```

3. Start the backend:

   ```bash
   ./dev.sh .env.dev --with-auth
   ```

4. In `mobile/.env`, make sure `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set to your real Clerk publishable key.

The app will show real sign-in/sign-up screens. Clerk magic-code emails work in the simulator (use any email you control). The backend verifies real Clerk JWTs. OMDb search and AI chat are fully functional.

### Option D: Deployed Staging Backend

Target a deployed staging backend (e.g., on Fly.io) instead of running locally.

```bash
# Deploy the backend to Fly.io
./backend.sh

# Set EXPO_PUBLIC_API_URL in mobile/.env to the Fly.io URL
# e.g., EXPO_PUBLIC_API_URL=https://tabletop-api.fly.dev/v1
```

No Docker needed on your Mac. The mobile app connects to the staging server over the internet. Good for testing against a production-like environment.

---

## 3. iOS Simulator

### Starting the App

```bash
cd mobile

# Copy env if you haven't yet
cp .env.example .env

npx expo start
# Press 'i' in the terminal to open iOS Simulator
```

Expo will build the JavaScript bundle and launch the app in the simulator. The first launch takes ~30 seconds; subsequent launches are faster.

### Platform-Specific API URLs

The iOS Simulator **shares your Mac's network stack.** This means `localhost` in the simulator is the same `localhost` as your Mac.

In `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:8080/v1
```

This "just works" because the Simulator can reach services bound to your Mac's ports.

### Troubleshooting iOS Simulator

| Problem | Cause | Solution |
|---------|-------|----------|
| **"Could not connect to server"** | Backend not running | Run `./dev.sh` or `curl http://localhost:8080/v1/health` to verify |
| **"Network request failed"** | Wrong API URL | Check `mobile/.env` — must be `http://localhost:8080/v1` |
| **Simulator not launching** | Xcode not fully installed | Open Xcode at least once, accept licenses. Go to Xcode > Settings > Platforms and ensure an iOS Simulator runtime is installed |
| **Simulator opens but Expo doesn't load** | Metro bundler issue | Press `Shift+R` in the terminal to reload, or restart with `npx expo start --clear` |
| **Black/white screen after launch** | JS bundle error | Press `Cmd+Shift+H` to go to the home screen, then tap the app icon to reopen. Check terminal for red error messages |
| **"No bundle URL present"** | Metro bundler not connected | Ensure `npx expo start` is running. If using a physical device, make sure both are on the same WiFi |
| **Clerk sign-in shows blank** | Missing Clerk key | Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `mobile/.env`. Restart `npx expo start --clear` after changing env |
| **App stuck on loading screen** | Auth sync failing with backend | Ensure backend is running and `DEV_SKIP_AUTH=true` matches between backend and frontend. Check backend terminal for errors |

### Useful iOS Simulator Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+H` | Go to home screen (simulates home button press) |
| `Cmd+D` | Open developer menu (with app focused) |
| `Cmd+R` | Reload JS bundle |
| `Cmd+K` | Toggle software keyboard |
| `Cmd+Shift+K` | Connect/disconnect hardware keyboard |
| `Cmd+1/2/3/4` | Change zoom level |

---

## 4. Android Emulator

### Starting the App

```bash
cd mobile

# Copy env if you haven't yet
cp .env.example .env

npx expo start
# Press 'a' in the terminal to open Android Emulator
```

### Setting Up Android Emulator

1. **Install Android Studio** from https://developer.android.com/studio
2. Open Android Studio → **More Actions** → **Virtual Device Manager** (or **Tools** → **Device Manager** within a project)
3. Click **Create Device**
4. Choose a phone model (Pixel 7 or Pixel 8 are good defaults)
5. Select a system image — pick one with **API 34** or newer. Click **Download** next to the image name if it's not already installed
6. Give the AVD a name and click **Finish**
7. Click the **Play** ▶️ button next to your new device in Device Manager to start it
8. Once the emulator is fully booted (you see the Android home screen), run:

   ```bash
   cd mobile
   npx expo start
   # Press 'a'
   ```

### **Critical: Platform-Specific API URLs**

This is the #1 cause of Android networking issues. **Do not skip this section.**

The Android Emulator runs as a **separate virtual machine** with its own network stack. Inside the emulator:

- `localhost` / `127.0.0.1` → the **emulator itself**, NOT your Mac
- `10.0.2.2` → a **special alias** that maps to your Mac's `localhost`

In `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/v1
```

> **⚠️ NEVER use `localhost` or `127.0.0.1` in the Android Emulator config.** It will try to connect to a server inside the emulator's own virtual machine, which isn't running anything. Always use `10.0.2.2`.

**Important:** Creating a single `.env` file that works for both iOS Simulator and Android Emulator requires switching the URL manually because the networking models are fundamentally different. See [Switching Between Backend Targets](#7-switching-between-backend-targets) for a recommended workflow.

### Troubleshooting Android Emulator

| Problem | Cause | Solution |
|---------|-------|----------|
| **"Connection refused" / "ECONNREFUSED"** | Using `localhost` instead of `10.0.2.2` | Set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/v1` in `mobile/.env` and restart with `--clear` |
| **Emulator won't start** | Missing Android SDK or system image | Open Android Studio → Virtual Device Manager → ensure a device is created with a downloaded system image |
| **Emulator starts but Expo can't connect** | ADB issues | Run `adb devices` to verify the emulator is listed. Restart ADB: `adb kill-server && adb start-server` |
| **App crashes on launch** | `react-test-renderer` version mismatch | This is a dev-only dependency. If `jest-expo` pulls a mismatched version, ensure `react-test-renderer` in `mobile/package.json` matches the React version (`18.3.1`). Run `npm ls react-test-renderer` to verify |
| **Metro bundler: "Unable to resolve module"** | Workspace packages not linked | Run `npm install` at the project root to re-link `@tabletop/shared`. Then `cd mobile && npx expo start --clear` |
| **Slow emulator performance** | Hardware acceleration disabled | Enable **Intel HAXM** (Intel Macs) or **Apple Hypervisor** (Apple Silicon) in Android Studio → Preferences → Emulator |
| **"INSTALL_FAILED_UPDATE_INCOMPATIBLE"** | Existing app conflicting | Uninstall the old app from the emulator first: `adb uninstall com.tabletop.app` |
| **Touch / click not responding** | Emulator hung | Cold-boot the emulator from Device Manager (▼ menu → **Cold Boot Now**) |

---

## 5. Physical Device (Optional)

You can also run the app on a real iPhone or Android device via Expo Go.

### Setup

1. **Find your Mac's local IP:**

   ```bash
   ipconfig getifaddr en0
   # Example output: 192.168.1.42
   ```

2. **Set the API URL** in `mobile/.env`:

   ```
   EXPO_PUBLIC_API_URL=http://<YOUR_IP>:8080/v1
   ```

3. **Firewall:** Ensure your Mac's firewall allows incoming connections on port 8080 (System Settings → Network → Firewall → Options → add your terminal app or disable firewall temporarily)

4. **Same WiFi:** Your Mac and your device must be on the same WiFi network. Corporate networks with client isolation won't work.

5. **Install Expo Go:**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

6. **Scan the QR code** from `npx expo start` with your phone's camera (iOS) or Expo Go app (Android)

### Limitations

- Expo Go doesn't support native modules that require custom native code. The Tabletop app only uses Expo-compatible libraries, so Expo Go should work for all features.
- Physical device must maintain WiFi connectivity to your Mac for hot reload.

---

## 6. Auth Modes

### Staging Auth (Default)

When `DEV_SKIP_AUTH=false` in `.env.staging`:

- The backend verifies real Clerk JWTs against Clerk's JWKS endpoint
- The backend uses staging Postgres/Redis service URLs from `.env.staging`
- The mobile app shows real Clerk sign-in/sign-up screens
- Sign-in uses Clerk's magic code (email verification) flow
- Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `mobile/.env` to your real Clerk publishable key
- **Available for:** Full end-to-end testing including auth flows, OMDb search, and AI recipe generation

### Dev Auth (No Real Keys Needed)

When `DEV_SKIP_AUTH=true` in backend `.env.dev`:

- The backend skips Clerk JWT verification entirely
- The app signs in automatically with a synthetic dev user
- No real Clerk, OMDb, or OpenAI keys are required
- **Perfect for:** UI/UX development, layout work, component styling, navigation testing
- **Not available for:** Testing real authentication flows, OMDb search, or AI chat

### Local DB with Real Auth

When `DEV_SKIP_AUTH=false` in backend `.env.dev`:

- The backend verifies real Clerk JWTs against Clerk's JWKS endpoint
- The mobile app shows real Clerk sign-in/sign-up screens
- Sign-in uses Clerk's magic code (email verification) flow
- Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `mobile/.env` to your real Clerk publishable key
- **Available for:** Full end-to-end testing including auth flows, OMDb search, and AI recipe generation

**How to switch between modes:**

1. Choose the env file: `.env.staging` for default staging services, or `.env.dev` for local mock/local DB work.
2. Start with `./dev.sh`, `./dev.sh .env.dev --mock-auth`, or `./dev.sh .env.dev --with-auth`.
3. Restart the mobile app: `cd mobile && npx expo start --clear`

---

## 7. Switching Between Backend Targets

The `EXPO_PUBLIC_API_URL` in `mobile/.env` determines which backend the mobile app talks to.

| Scenario | `EXPO_PUBLIC_API_URL` | Backend |
|----------|----------------------|---------|
| iOS Simulator + local backend | `http://localhost:8080/v1` | `./dev.sh` running on Mac |
| Android Emulator + local backend | `http://10.0.2.2:8080/v1` | `./dev.sh` running on Mac |
| Physical device + local backend | `http://192.168.1.X:8080/v1` | `./dev.sh` running on Mac |
| Any + staging backend | `https://your-app.fly.dev/v1` | Deployed on Fly.io |

**Recommended workflow for switching between iOS and Android:**

Keep two `.env` files:

- `mobile/.env.ios` — contains `EXPO_PUBLIC_API_URL=http://localhost:8080/v1`
- `mobile/.env.android` — contains `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/v1`

Then before starting:

```bash
# For iOS Simulator
cp .env.ios .env && npx expo start --clear

# For Android Emulator
cp .env.android .env && npx expo start --clear
```

> **Note:** `EXPO_PUBLIC_*` env vars are baked into the JS bundle at build time. Always use `--clear` when you change them, or the old value will persist in the Metro cache.

---

## 8. Troubleshooting

### General Issues

| Problem | Solution |
|---------|----------|
| **npm install fails with workspace errors** | Delete `node_modules` at root, `frontend/`, and `mobile/`, then `npm install` again from root |
| **Expo can't find @tabletop/shared** | Run `npm install` at the project root to re-link workspace packages |
| **TypeScript errors in IDE** | Ensure you've run `npm install` at root. The `tsconfig.json` in `mobile/` uses path aliases that resolve to workspace packages |
| **Expo CLI not found** | Run `npx expo` (not `expo`). It's installed as a project dependency |
| **Port 8080 already in use** | Another process is using the port. Find it: `lsof -i :8080`. Stop that process or change `PORT` in `.env.dev` |
| **Port 8081 already in use** | Metro bundler from another Expo project. Kill it: `lsof -ti:8081 | xargs kill` |

### Metro Bundler Issues

| Problem | Solution |
|---------|----------|
| **"Unable to resolve module"** | Clear Metro cache: `cd mobile && npx expo start --clear` |
| **Slow bundling** | Metro caches to speed up subsequent runs. First cold start is slow (30-60s). If persistently slow, check for watchman issues: `watchman shutdown-server` |
| **Hot reload not working** | Press `R` (not `Cmd+R`) in the Expo terminal to reload. If still broken, restart with `--clear` |
| **Changes to .env not picked up** | `EXPO_PUBLIC_*` vars are inlined at bundle time. Always `--clear` after env changes |

### Running Tests

```bash
# TypeScript check (no emit — just type checking)
cd mobile && npx tsc --noEmit

# Run test suite (Jest)
cd mobile && npm test
```

---

## 9. Useful Commands

```bash
# ── Starting the app ────────────────────────────────────────────────

# Interactive (choose iOS/Android/web)
cd mobile && npx expo start

# Launch iOS Simulator directly
cd mobile && npx expo start --ios

# Launch Android Emulator directly
cd mobile && npx expo start --android

# Clear Metro cache and restart
cd mobile && npx expo start --clear

# ── TypeScript ──────────────────────────────────────────────────────

# Type check without emitting files
cd mobile && npx tsc --noEmit

# ── Testing ─────────────────────────────────────────────────────────

# Run all tests
cd mobile && npm test

# Run tests in watch mode
cd mobile && npm test -- --watch

# ── Native builds (EAS) ─────────────────────────────────────────────

# Create a development build
cd mobile && eas build --profile development

# Create a production build
cd mobile && eas build --profile production

# ── Backend control ─────────────────────────────────────────────────

# Start backend + frontend locally
./dev.sh

# Check backend health
curl http://localhost:8080/health

# Stop Docker services
docker compose down

# Reset Docker volumes (destroys all local data)
docker compose down -v

# ── Troubleshooting ─────────────────────────────────────────────────

# Kill any lingering Expo/Metro processes
killall node

# Check what's running on the Expo ports
lsof -i :8081 -i :19000 -i :19001

# List connected Android devices/emulators
adb devices

# Restart Android Debug Bridge
adb kill-server && adb start-server

# List available iOS Simulators
xcrun simctl list devices available

# Boot a specific iOS Simulator by UDID
xcrun simctl boot <UDID>
```

---

## 10. Project Architecture (Quick Reference)

The mobile app follows the same patterns as the web frontend:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Routing** | Expo Router (file-based) | Pages in `mobile/app/` map to routes |
| **Auth** | `@clerk/clerk-expo` | Magic-code email auth, JWT token management |
| **API** | Axios instance | Token injection via Clerk `getToken()`, 401 retry with sign-out |
| **Server state** | `@tanstack/react-query` | All API data fetching, caching, mutations |
| **Client state** | Zustand | UI state, current instance, auth flags |
| **Navigation** | `expo-router` | Stack/tab navigation, deep linking via `tabletop://` scheme |
| **Shared** | `@tabletop/shared` | TypeScript types, query key factories, validators |

### Key Files

```
mobile/
├── app/
│   ├── _layout.tsx              # Root layout: ClerkProvider, QueryClient, AuthBridge
│   ├── (auth)/                  # Sign-in and sign-up screens
│   └── (app)/                   # Authenticated screens (dashboard, instances, etc.)
├── src/
│   ├── lib/api.ts               # Axios instance, token bridge, 401 handling
│   ├── lib/queryClient.ts       # TanStack Query client config
│   ├── stores/                  # Zustand stores (auth, instance, UI)
│   ├── hooks/                   # TanStack Query hooks (one per domain)
│   └── components/              # Reusable UI components
└── .env                         # EXPO_PUBLIC_* env vars
```

### Deep Link Scheme

The app registers the `tabletop://` URL scheme for deep linking:

| Deep Link | Route |
|-----------|-------|
| `tabletop://` | Home / redirect |
| `tabletop://instances/:id` | Instance home |
| `tabletop://instances/:id/recipes` | Instance recipes tab |
| `tabletop://instances/:id/wines` | Wines tab |
| `tabletop://instances/:id/media` | Media tab |
| `tabletop://instances/:id/chat` | Chat tab |
| `tabletop://instances/:id/ai` | AI assistant tab |
| `tabletop://instances/:id/recipes/cook/:recipeId` | Fullscreen cooking view |
| `tabletop://instances/:id/nights` | Game nights tab |
| `tabletop://instances/:id/spin` | Spin the night feature |

Deep links work in Expo Go and development builds. Test in the simulator with:

```bash
# iOS Simulator
xcrun simctl openurl booted "tabletop://instances/123/recipes"

# Android Emulator
adb shell am start -a android.intent.action.VIEW -d "tabletop://instances/123/recipes"
```

---

## Appendix: Dependency Versions

| Package | Version |
|---------|---------|
| Expo SDK | 52 |
| React Native | 0.76.9 |
| React | 18.3.1 |
| Clerk Expo | 2.x |
| TanStack Query | 5.32.x |
| Zustand | 4.5.x |
| Axios | 1.6.x |
| TypeScript | 5.4.x |
