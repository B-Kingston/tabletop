# Tabletop

Track media, wines, and recipes with the people you share them with.

> **Note:** This project was built with AI assistance — from architecture and code generation to review and iteration. It's a deliberate experiment in treating AI as a co-developer rather than just a tool.

## Two Ways to Run Locally

| Mode | Command | What's running | Use for |
|------|---------|--------------|---------|
| **Dev** (fast iteration) | `./dev.sh` | Docker infra (Postgres + Redis) + native Go backend + native Vite frontend | Daily development, hot-reload |
| **Prod-like** (containerized) | `./run.sh` | Full Docker Compose stack (db, redis, api, web) | Testing the production build, CI verification |

### Dev mode (`./dev.sh`)

Requires **Go 1.22+**, **Node 20+**, and **Docker**.

```bash
# One-time setup
cp .env.dev.example .env.dev
# Optional: install Go hot-reloader
# go install github.com/air-verse/air@latest

./dev.sh
```

- Postgres + Redis start in Docker
- Backend runs natively at `http://localhost:8080` (auto-reloads with `air` if installed)
- Frontend runs natively at `http://localhost:3000` (Vite HMR)
- Press `Ctrl+C` to stop the native processes; Docker infra stays up (stop it with `docker compose down`)

### Prod-like mode (`./run.sh`)

Requires **Docker** only.

```bash
cp .env.example .env
# Fill in real Clerk, TMDB, and OpenAI keys

./run.sh
```

- All four services run in containers
- API available at `http://localhost:8080`
- Built SPA served by nginx at `http://localhost:3000`

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + TanStack Query + Zustand + Framer Motion
- **Backend:** Go + Gin + GORM + PostgreSQL (NeonDB)
- **Auth:** Clerk (magic code email verification)
- **Real-time:** WebSockets + Redis pub/sub
- **AI:** OpenAI GPT-4o-mini (server-side proxy with per-user rate limiting)
- **External:** TMDB API for media data

## Project Structure

```
tabletop/
├── backend/          # Go API
│   ├── cmd/api/      # Entry point
│   ├── internal/     # Application code
│   │   ├── config/
│   │   ├── database/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── utils/
│   │   └── websocket/
│   └── tests/        # Integration tests
├── frontend/         # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── types/
│   └── public/
├── docker-compose.yml
├── AGENTS.md         # AI coding constitution
├── SETUP.md          # External service setup guide
└── .env.example
```

## Testing

### Backend

```bash
cd backend
go test ./... -v
```

All business logic uses table-driven tests with testify. Integration tests use SQLite in-memory.

### Frontend

```bash
cd frontend
npm test
```

Components and hooks tested with React Testing Library + Vitest. API calls mocked with MSW.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Auth | Clerk magic-code email verification |
| Recipe Editor | Plate (Slate-based), serialized to markdown |
| AI | Server-side OpenAI proxy, per-user rate limits |
| Wine Rating | 0.0 – 5.0 with decimal support |
| Wine Cost | Per bottle, AUD default |
| Images | URL only, no uploads |
| Multiplayer | Password-protected instances with membership middleware |
| Data Isolation | Every query scoped by `instance_id` |

## Security

- Every API route verifies instance membership
- `instance_id` from URL params only, never body
- Instance passwords hashed with bcrypt (cost 12+)
- Clerk JWT validation on every protected route
- Audit fields (`created_by_id`, `updated_by_id`) on all content

## License

MIT
