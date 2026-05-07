# Tabletop

Track media, wines, and recipes with the people you share them with.

> **Note:** This project was built with AI **lots** of assistance, from architecture and code generation to review and iteration. It's a deliberate experiment in treating AI as a co-developer rather than just a tool.

## Local and Staging Commands

| Mode | Command | What's running | Use for |
|------|---------|--------------|---------|
| **Dev** (default staging) | `./dev.sh` | Native Go backend + native Vite frontend, using staging Postgres/Redis and real Clerk auth | Daily full-stack development against staging data |
| **Frontend prod build** | `./run.sh` | Built frontend in Docker/Nginx on port 3000, pointed at a deployed backend | Testing the production frontend against the real backend |
| **Backend deploy** | `./backend.sh` | Deploys the Go backend to Fly.io | Real backend deploys, logs, secrets, migrations |

### Dev mode (`./dev.sh`)

Requires **Go 1.22+** and **Node 20+**. Docker is only required when the selected env file points at local Postgres or Redis.

```bash
# One-time setup: create .env.staging with staging Clerk,
# DATABASE_URL, REDIS_URL, OMDb, and OpenAI values.

# Optional: install Go hot-reloader
# go install github.com/air-verse/air@latest

./dev.sh
```

- Real Clerk auth is enabled by default
- Backend runs natively at `http://localhost:8080` (auto-reloads with `air` if installed)
- Frontend runs natively at `http://localhost:3000` (Vite HMR)
- Backend dependencies come from `.env.staging`, usually staging Neon/Postgres and staging Redis
- Goose migrations run against the configured database when the backend starts

### Frontend production build (`./run.sh`)

Requires **Docker** only.

```bash
# Ensure .env contains CLERK_PUBLISHABLE_KEY and VITE_API_URL
# for the deployed backend.

./run.sh
```

- Builds the frontend Docker image
- Serves the built SPA through nginx at `http://localhost:3000`
- Requires `VITE_API_URL` to point at a deployed backend, not localhost

### Backend deploy (`./backend.sh`)

```bash
./backend.sh
```

Deploys the real Go backend to Fly.io. Use `./backend.sh --logs`, `./backend.sh --status`, `./backend.sh --secrets`, and `./backend.sh --migrate-status` for operations.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + TanStack Query + Zustand + Framer Motion
- **Backend:** Go + Gin + GORM + PostgreSQL (NeonDB)
- **Auth:** Clerk (magic code email verification)
- **Real-time:** WebSockets + Redis pub/sub
- **AI:** OpenAI GPT-4o-mini (server-side proxy with per-user rate limiting)
- **External:** OMDb API for media data

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
└── SETUP.md          # External service setup guide
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
