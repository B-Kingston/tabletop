# Setup Guide for External Services

This document contains step-by-step instructions for configuring all external services required by the Tabletop application.

---

## 1. NeonDB (PostgreSQL)

**What it is:** Serverless Postgres database for production (and local Postgres for dev).

**Steps:**
1. Go to https://neon.tech and sign up.
2. Create a new project. Choose the region closest to your users (e.g., US-East for Fly.io).
3. Create a database named `tabletop`.
4. Copy the connection string. It looks like:
   ```
   postgres://username:password@host.neon.tech/tabletop?sslmode=require
   ```
5. Add it to your `.env` as `DATABASE_URL`.
6. For local development, Docker Compose will spin up Postgres automatically. No Neon needed locally.

**Gotchas:**
- Neon uses connection pooling. If you see "too many clients" errors, ensure you're using their PgBouncer port (usually ends in `-pooler`) or set `SetMaxOpenConns(20)` in GORM.
- Always use `sslmode=require` in production.

---

## 2. Clerk (Authentication)

**What it is:** Handles user registration, login, email magic codes, and JWT session management.

**Steps:**
1. Go to https://dashboard.clerk.com and create an account.
2. Create a new application.
3. In **Authentication > Email, Phone, Username**, enable:
   - **Email verification code** (this is the magic code flow)
   - Disable password if you want pure magic-code auth
4. Go to **API Keys** and copy:
   - `Publishable Key` (starts with `pk_test_` or `pk_live_`)
   - `Secret Key` (starts with `sk_test_` or `sk_live_`)
5. Add to `.env`:
   ```
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
6. **Frontend:** Set `VITE_CLERK_PUBLISHABLE_KEY` in `frontend/.env.local`.
7. **Webhooks (optional but recommended):** In Clerk Dashboard, go to **Webhooks** and add an endpoint:
   - URL: `https://your-api.com/v1/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing Secret** to `CLERK_WEBHOOK_SECRET` in `.env`

**Gotchas:**
- Clerk's free tier allows 10,000 monthly active users.
- In development, Clerk works on `localhost`. In production, add your domain to **Sessions > Allowed redirect URLs**.
- The Go backend validates Clerk JWTs using their JWKS endpoint. No session storage needed on our side.

---

## 3. OMDb (The Open Movie Database)

**What it is:** Provides movie and TV show search data.

**Steps:**
1. Go to https://www.omdbapi.com and create an account.
2. Go to https://www.omdbapi.com/apikey.aspx.
3. Request an API key. Fill out the key request form.
4. Copy the API key from the OMDb email.
5. Add to `.env`:
   ```
   OMDB_API_KEY=your_key_here
   ```

**Gotchas:**
- Free keys have OMDb request limits; keep searches proxied through the backend.
- We proxy all OMDb calls through our Go backend to add caching and avoid exposing the key.
- Media artwork is not used for now.

---

## 4. OpenAI (Recipe Generation)

**What it is:** Powers the AI chat assistant that generates recipes.

**Steps:**
1. Go to https://platform.openai.com and sign up.
2. Add a payment method and set a usage limit (recommended: $10-20/month max).
3. Go to **API Keys** and create a new secret key.
4. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```

**Gotchas:**
- The backend proxies all OpenAI requests. Users do NOT need their own keys.
- Implement rate limiting (e.g., 20 requests per user per day) to control costs.
- Use GPT-4o-mini for cost efficiency; upgrade to GPT-4o if recipe quality needs improvement.
- Store no AI data permanently beyond chat history (which users can delete).

---

## 5. Redis (Caching & Rate Limiting)

**What it is:** In-memory store for caching OMDb results, rate limiting OpenAI usage, and WebSocket pub/sub.

**Local Development:**
- Docker Compose includes Redis automatically. No setup needed.

**Production (Upstash):**
1. Go to https://upstash.com and sign up.
2. Create a new Redis database.
3. Choose the region closest to your backend (e.g., US-East-1).
4. Copy the **Redis URL** (starts with `rediss://` for TLS).
5. Add to `.env`:
   ```
   REDIS_URL=rediss://default:password@host.upstash.io:6379
   ```

**Gotchas:**
- Upstash has a generous free tier (10,000 commands/day).
- Use TLS (`rediss://`) in production.
- For WebSocket horizontal scaling, we use Redis pub/sub as the message bus.

---

## 6. Fly.io (Backend Hosting)

**What it is:** Platform for running the Go backend and WebSocket server.

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run `fly auth login`
3. From the `backend/` directory, run:
   ```bash
   fly launch
   ```
4. Set secrets:
   ```bash
   fly secrets set DATABASE_URL="..."
   fly secrets set CLERK_SECRET_KEY="..."
   fly secrets set OMDB_API_KEY="..."
   fly secrets set OPENAI_API_KEY="..."
   fly secrets set REDIS_URL="..."
   ```
5. Deploy: `fly deploy`

**Gotchas:**
- Fly.io free tier includes 3 shared-cpu-1x VMs.
- WebSockets work natively on Fly.io without extra configuration.
- Use `fly logs` to monitor in real-time.

---

## 7. Vercel (Frontend Hosting)

**What it is:** Platform for hosting the React frontend.

**Steps:**
1. Push your repo to GitHub.
2. Go to https://vercel.com and import the project.
3. Set root directory to `frontend/`.
4. Add environment variable:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_...
   VITE_API_URL=https://your-fly-app.fly.dev
   ```
5. Deploy.

**Gotchas:**
- Vercel's free tier is generous for personal projects.
- Ensure your Fly.io CORS config allows your Vercel domain.

---

## Quick Checklist Before First Run

- [ ] `.env` file created with production service values
- [ ] NeonDB project created and `DATABASE_URL` set
- [ ] Clerk app created, magic codes enabled, keys copied
- [ ] OMDb API key requested and copied
- [ ] OpenAI API key created and copied
- [ ] Redis running locally (via Docker) or Upstash URL set
- [ ] Frontend `.env.local` has `VITE_CLERK_PUBLISHABLE_KEY`

## Running Locally

```bash
# 1. Start infrastructure
docker-compose up -d db redis

# 2. Ensure .env exists with your real keys

# 3. Run backend
cd backend
go run ./cmd/api

# 4. In another terminal, run frontend
cd frontend
npm install
npm run dev
```

The app will be at http://localhost:3000 and API at http://localhost:8080.

---

## 8. Mobile App (iOS & Android)

Tabletop has three clients: **web** (React + Vite), **iOS** (Expo React Native), and **Android** (same Expo codebase). The mobile app lives in `mobile/` and uses Expo SDK 52.

**Quick start:**

```bash
# 1. Backend (same as web — can be shared)
# Ensure .env.staging exists with staging keys and service URLs, then:
./dev.sh

# 2. Mobile app
cd mobile
# Ensure .env exists with production service values
npx expo start
# Press 'i' for iOS Simulator or 'a' for Android Emulator
```

**Platform environment variables (in `mobile/.env`):**

| Variable | Purpose |
|----------|--------|
| `EXPO_PUBLIC_API_URL` | Backend API URL (varies by platform — see below) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for mobile auth |

**Critical platform difference:** The Android Emulator uses `10.0.2.2` to reach your Mac's localhost (NOT `localhost`). The iOS Simulator shares your Mac's network, so `localhost` works directly. A physical device needs your Mac's LAN IP. See the full guide for details.

**Full documentation:** See [`docs/mobile/local-development.md`](docs/mobile/local-development.md) for a complete walkthrough covering iOS Simulator, Android Emulator, physical devices, auth modes, and troubleshooting.
