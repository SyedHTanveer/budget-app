# Budget App Monorepo

Full‑stack budgeting application.

## Stack

- Backend: Node.js, Express, Knex, SQLite (dev), BullMQ (queues), JWT auth (access + rotating refresh cookie), Plaid, OpenAI (AI assistant via SSE)
- Frontend: Vite + React + TypeScript, Redux Toolkit + RTK Query, shadcn/ui
- API base path: `/api/v1`

## Features (Backend)

- Auth: register/login, short‑lived access token in memory, rotating refresh token cookie, session listing & revocation, reuse detection
- Plaid: link & exchange, historical backfill queued, incremental sync via webhook & cursor, institution & unique constraints, upsert logic
- Budget engine: categories CRUD, rollover modes, vacation exclusion periods, paused categories, month close, spending & simulation endpoints
- Vacation periods: overlap validation
- Rollover automation: scheduled/queued service
- Alerts engine: balance/category/safe‑to‑spend alerts with cooldown + enqueue on transaction updates
- AI Assistant: chat + true streaming SSE (`/api/v1/ai/stream`), quota & usage tracking, redaction layer
- Export jobs: async zip creation, status & download, cleanup job
- Audit logging + ops endpoints (`/api/v1/ops/health`, `queues`)

## Features (Frontend)

- Central data layer in `src/store/api.ts` (RTK Query) with auth token refresh + 401 retry logic
- Plaid link modal UX with distinct handling for `complete | pending | already_linked`
- Streaming AI UI component assembling SSE chunks
- Toast pattern for all mutations

## Queues

BullMQ queues: `plaid`, `export`, `alerts`, `rollover` (graceful no‑op if Redis absent). Workers: `backend/src/worker.js`.

## Data Integrity

- Unique constraints (Plaid items, accounts, transactions) enforce idempotent upsert patterns
- Negative amounts represent outflow
- Guarded migrations (idempotent with `hasTable` / `hasColumn` checks)

## Development

1. Install deps: `npm install` in both `backend/` and `frontend/` (or use a workspace script if added later)
2. Run migrations: `cd backend && npx knex migrate:latest`
3. Start dev (concurrent): VS Code task "Start Full Development" or manually:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`
4. Open app at frontend dev URL (Vite) – API requests proxy to `/api/v1`

Reset dev DB: delete `backend/data/budget_app.db` then re‑run migrations.

### Redis (Docker)

For queues & caching you need Redis 7 running locally. Quick start (detached):

```bash
docker pull redis:7-alpine
docker run -d --name budget-redis -p 6379:6379 redis:7-alpine --appendonly no
```

Set `REDIS_URL=redis://localhost:6379` in backend `.env`. Stop/remove with:

```bash
docker stop budget-redis && docker rm budget-redis
```

App will gracefully no‑op queue features if Redis is absent.

## Key Paths

- Backend entry: `backend/src/index.js`
- Routes: `backend/src/routes/*.js` (all under `/api/v1`)
- Services: `backend/src/services/`
- Queue worker: `backend/src/worker.js`
- Frontend entry: `frontend/src/main.tsx`
- API slice: `frontend/src/store/api.ts`
- Plaid modal: `frontend/src/components/ConnectBankModal.tsx`
- AI assistant: `frontend/src/components/AIAssistant.tsx`

## Environment (excerpt)

`JWT_SECRET`, `OPENAI_API_KEY`, `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`, optional `PLAID_WEBHOOK_SECRET`, `REDIS_URL`.

## Testing

Backend Jest tests in `backend/tests/*.test.js` covering auth, migrations, Plaid sync, alerts, AI quota, rollover, sessions, export, token reuse.

## Conventions

- Additive API changes only; preserve response shapes
- Heavy Plaid sync/backfill work is queued, not inline
- All new endpoints under `/api/v1` and thin: delegate logic to services
- Use RTK Query for data access (avoid ad‑hoc fetch)
- Provide toasts on success/failure of user mutations

## Extending

Follow path: migration (if needed) -> service -> route -> RTK Query endpoint/tag -> component integration -> queued jobs for long tasks.

## Ops Checks

- Health: `GET /api/v1/ops/health`
- Queues: `GET /api/v1/ops/queues`
- AI streaming: open Network tab to observe SSE events.

---

Concise overview intended for quick orientation; see inline code comments & tests for details.
