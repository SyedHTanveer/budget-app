# Copilot Project Instructions

Purpose: Rapid orientation for AI coding agents working on this full‑stack budgeting app. Focus on existing patterns – do not invent new architectures.

## Memory System 🧠

**CRITICAL**: Before starting any work, read `.memory/index.md` to understand:
- What features are already built
- Recent architectural decisions
- Current project state and priorities
- What's planned vs. what's done

**After completing work**: Create a memory file documenting what was built and key decisions:
1. Copy `.memory/TEMPLATE.md` to `.memory/YYYY-MM-DD_your-topic.md`
2. Fill in the template with context, decisions, and outcomes
3. Add summary entry to `.memory/index.md` under "Recent Sessions"
4. Update "Current State" sections in index.md as needed
5. Commit memory file with your code changes

This ensures continuity across sessions and prevents rebuilding existing features.

## Architecture & Tech
- Monorepo: `backend/` (Node.js Express + Knex + SQLite dev) and `frontend/` (Vite React TS, Redux Toolkit + RTK Query, shadcn/ui).
- API base path: `/api/v1`. Frontend dev proxy auto forwards (see `frontend/vite.config.ts`).
- Auth: Short‑lived JWT access token (held in memory only) + rotating refresh token (HTTP‑only cookie at `/api/v1/auth`). Token refresh & 401 retry handled centrally in `frontend/src/store/api.ts`.
- Async & background: BullMQ queues (`plaid`, `export`, `alerts`, `rollover`). Code must no‑op gracefully if Redis unavailable.
- Streaming: SSE for AI at `/api/v1/ai/stream` (component `AIAssistant.tsx`).

## Backend Conventions
- Routes: One feature per file under `backend/src/routes/`; mounted via versioned router. Always prefix new endpoints with `/api/v1`.
- Services: Business logic isolation (`plaidService`, `alertsEngine`, `rolloverService`, `aiService`, etc.). Reuse/extend services rather than embedding logic inside routes.
- Migrations: JS timestamp files in `backend/src/migrations/`. Use guards (`hasTable`, `hasColumn`, try/catch on indexes/uniques) for idempotency. Never create another variant of preferences; unified tables: `user_preferences`, `user_budget_prefs`.
- Data Integrity: Recent migrations add unique constraints for Plaid (`plaid_items.item_id`, `accounts (user_id, plaid_account_id)`, `transactions.plaid_transaction_id`). New ingestion code should rely on upserts not blind inserts.
- Plaid Patterns:
  - Link flow: POST `/plaid/link-token` → client opens Link → POST `/plaid/exchange-token`.
  - `exchangePublicToken` now: upserts item, accounts, dedupes by institution; returns `status: complete | pending | already_linked` (pending = PRODUCT_NOT_READY; enqueue incremental sync job, HTTP 202). Frontend treats pending as soft success and shows “transactions syncing”. Preserve this contract.
  - Do NOT immediate re-fetch large historical ranges inline; enqueue jobs (`plaid` queue) for heavy backfill.
  - Webhooks: `/plaid/webhook` triggers incremental sync (verify secret if set).
- Queues: Workers in `backend/src/worker.js`. When adding a new queued task supply a lightweight payload (ids only) and update Ops stats if needed.
- Transactions: Store negative amounts for outflow (Plaid uses positive/negative semantics). Avoid duplicate inserts—check unique keys.
- Preferences: Seed row on GET if missing. Extend schema via alterTable guarded migration.
- Error Handling: Wrap external service calls, on failure raise `ExternalServiceError` for consistent client messaging.

## Frontend Conventions
- Central data layer: `src/store/api.ts` (RTK Query). Add new endpoints + tags for proper cache invalidation. Avoid ad‑hoc fetches—except initial Plaid link token fetch which shows auth gating pattern.
- Auth handling: Never persist access token (no localStorage). Use provided `setAccessToken/getAccessToken` utilities.
- UI: Use shadcn/ui primitives under `components/ui`. Pattern: feature container components (e.g. `ExportPanel`, `Goals`, `AIAssistant`, `ConnectBankModal`). Keep hook order stable; for conditional flows use early returns or child components.
- Plaid UX: Close modal during Link (iframe focus), reopen to display outcome. Handle `already_linked` and `pending` statuses distinctly (sync notice).
- Streaming AI: SSE assembly logic already implemented; replicate if adding new streaming endpoints.
- Toasts: All user‑visible mutations should trigger success/failure toasts (central error toasting already in baseQuery).

## Adding a Feature (Standard Path)
1. Migration (guarded) if schema changes.
2. Service method (or extend existing) for business logic.
3. Route file with minimal orchestration → call service.
4. RTK Query endpoint + tag updates.
5. Component / UI integration using existing primitives & toast pattern.
6. Async workloads → enqueue job instead of long blocking request; expose polling or status endpoint (mirror export job pattern if similar lifecycle).

## Key Files Reference
- Backend entry: `backend/src/index.js`
- Auth middleware: `backend/src/middleware/auth.js`
- Plaid logic: `backend/src/services/plaidService.js`
- Worker queues: `backend/src/worker.js`
- Frontend API slice: `frontend/src/store/api.ts`
- Plaid modal UX: `frontend/src/components/ConnectBankModal.tsx`
- AI streaming: `frontend/src/components/AIAssistant.tsx`

## Testing & Dev Workflow
- Start full stack (dev): run workspace task "Start Full Development" or manually: backend then frontend dev scripts.
- Apply migrations: `cd backend && npx knex migrate:latest` (delete `backend/data/budget_app.db` to reset dev DB).
- Manual checks: `/api/v1/ops/health`, `/api/v1/auth/refresh`, AI SSE in network tab, export job lifecycle.

## Gotchas
- SQLite dev: some `returning('*')` calls may not return rows—read them back when necessary (pattern already used). Maintain this for portability.
- PRODUCT_NOT_READY from Plaid: return 202 + enqueue; do not block synchronously.
- Unique constraints mean duplicate insertion now fails—always perform existence check or use upsert logic.
- Keep new migrations forward-safe; avoid destructive DOWN sections for added safety in collaborative dev.

## MCP Assisted Research
Use available MCP tools before guessing APIs or component props:
- Library Docs (Context7): When adding/upgrading usage of an external library, first resolve then fetch docs.
  1. resolve-library-id with the package name (e.g. 'react-plaid-link', 'reduxjs/redux-toolkit', 'plaid').
  2. mcp_context7_get-library-docs with focused topic (e.g. hooks, routing, configuration) to confirm API shapes.
  Only fetch what you need (set topic); avoid over-pulling tokens.
- GitHub Deepwiki: For third-party repo patterns (if referencing external public repos) use read_wiki_structure then ask_question for targeted clarifications instead of scanning code manually.
- shadcn Components: List components via mcp_shadcn_getComponents; fetch specific component docs via mcp_shadcn_getComponent before introducing a new UI primitive. Reuse existing local wrappers in `components/ui` when present; if adding a new one, mirror styling & props of peers.

Guidelines:
- Prefer reading docs once per feature change; cache mental model; avoid repeated calls.
- Do not hallucinate props or options—validate with docs tool first if uncertain.
- When extending Plaid integration: check Plaid Node SDK docs (context7) for endpoint or field names; never invent response fields.
- Summarize retrieved doc snippets inline (concise) before coding significant changes so reviewers see the rationale.

## Style & Safety
- Prefer small, focused commits touching one feature boundary.
- Preserve API response shapes when extending (additive changes over breaking modifications).
- Ask for clarification before introducing new tables overlapping existing preference or budgeting concepts.

If any area above is unclear or you need deeper detail (e.g., alerts engine, rollover math, AI redaction), request a focused expansion before coding.
