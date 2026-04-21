# Tabletop

Track media, wines, and recipes with the people you share them with.

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

## Quick Start

### Prerequisites

- Go 1.22+
- Node.js 20+
- Docker & Docker Compose
- Accounts: Clerk, TMDB, OpenAI, NeonDB (see [SETUP.md](./SETUP.md))

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your real API keys
```

### 2. Start Infrastructure

```bash
docker-compose up -d db redis
```

### 3. Run Backend

```bash
cd backend
go run ./cmd/api
```

### 4. Run Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Visit http://localhost:3000

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
