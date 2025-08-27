# Budget App Backend

## Key Features Implemented
- Auth with rotating refresh tokens, session listing & revocation, reuse detection
- Plaid integration: link, exchange, historical backfill, incremental sync, webhook with secret
- Budget engine with pay schedule, rollover modes, vacation exclusion, paused categories
- Vacation periods CRUD + overlap validation
- Rollover automation service (manual trigger endpoint)
- Alerts engine with cooldown, category/balance/safe-to-spend alerts, enqueue on transaction updates
- AI Assistant: chat quota, true streaming SSE with OpenAI (redaction), usage tracking
- Export jobs (async zip), download & cleanup job
- Audit logging, ops endpoints (/api/v1/ops/health, /api/v1/ops/queues)

## Important Routes (prefix /api/v1)
- auth: register, login, refresh, logout, me, sessions (GET/DELETE)
- accounts, transactions (category update, spending-by-category)
- budget: status, simulate, can-afford, categories CRUD, categories/spending, close-month
- vacation: list/create/delete
- alerts: CRUD + events
- ai: usage, chat, stream (SSE)
- plaid: link-token, exchange-token, sync-transactions, sync-incremental, enqueue-incremental, initial-backfill, webhook
- export: POST (enqueue), GET list/status/download
- user: DELETE (hard delete)
- ops: health, queues

## Queues
BullMQ queues: plaid, export, alerts, rollover.

## Environment Variables (excerpt)
- OPENAI_API_KEY, PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV
- PLAID_WEBHOOK_SECRET for webhook auth
- JWT_SECRET
- REDIS_URL

## Tests
See tests/*.test.js for coverage on auth, alerts, ai quota, rollover, sessions, token reuse, migrations, export, webhook sync.