# Memory Index

Quick reference to all memory files, organized by recency and category.

**Last Updated**: 2025-10-05

---

## Recent Sessions (Last 30 Days)

<!-- New entries added at top -->

### 2025-10-05: Memory System Setup `[ARCHITECTURE]`
- **File**: `2025-10-05_memory-system-setup.md`
- **Summary**: Created `.memory` folder structure for tracking development context across sessions
- **Key Points**: Established file format, naming conventions, agent integration workflow, git hooks

---

## By Category

### Features
- (Future entries here)

### Architecture
- 2025-10-05: Memory system setup

### Integrations
- (Plaid integration entries will go here)

### Planning
- (Feature planning sessions)

### Experiments
- (Failed experiments and learnings)

---

## Quick Reference: Current State

### ✅ Completed Features

**Auth & Security**
- JWT access tokens (in-memory only)
- Rotating refresh tokens (HTTP-only cookies)
- Token refresh with 401 retry logic
- Audit logging
- Privacy controls

**Plaid Integration**
- Link token generation
- Public token exchange with deduplication
- Account syncing with unique constraints
- Transaction sync (incremental via sync API)
- Webhook handling (PRODUCT_NOT_READY, DEFAULT_UPDATE)
- Async initial backfill via BullMQ
- Institution metadata storage

**Budget Engine**
- Budget categories and allocations
- Multiple rollover modes (none, month-to-month, year-to-year)
- Vacation periods with overlap validation
- Budget rollover calculations
- Budget preferences (unified table)

**Transactions**
- Plaid transaction ingestion
- Negative amounts for outflows
- Removed transaction flagging
- Transaction categorization

**Alerts Engine**
- Alert rules (budget threshold, low balance, large transaction)
- Cooldown periods
- Alert history tracking
- Async alert processing via BullMQ

**Goals & Savings**
- Savings goals with target amounts
- Priority field for goal ordering
- Manual allocations to goals

**AI Assistant**
- OpenAI integration with streaming (SSE)
- PII redaction before sending to AI
- Chat usage tracking per user
- Financial analysis capabilities

**Export & Jobs**
- Async export job creation
- ZIP file generation with transactions CSV
- Job status tracking (pending, processing, complete, failed)
- Polling endpoint for job status

**Operations**
- Health check endpoint
- Redis connection status
- Queue metrics (job counts, queue names)
- BullMQ graceful degradation (queues no-op if Redis unavailable)

### 🚧 In Progress
- Memory system finalization (git hooks)

### 📋 Planned / Not Yet Built

**Frontend UI Gaps**
- User settings/preferences panel
- Transaction filtering UI (date range, category, amount)
- Bulk transaction operations (recategorize, delete)
- Budget category detail modal (drill-down view)
- Goal creation and management UI
- Rule engine UI for auto-categorization
- Net worth chart/visualization
- Spending trends and insights

**Backend Enhancements**
- Transaction search and advanced filtering
- Budget template system (copy month-to-month)
- Recurring transaction detection
- Auto-categorization rules engine
- Net worth calculation service
- Spending insights/analytics service

**Integration Improvements**
- Multi-bank account linking UI flow
- Bank connection health monitoring
- Account refresh on-demand
- Transaction memo/notes editing

**DevOps & Monitoring**
- Production deployment setup
- Error tracking (Sentry or similar)
- Performance monitoring
- Database backup strategy

### 🐛 Known Issues
- None currently documented

### 🤔 Open Questions
- Production database choice (Postgres vs. continue with SQLite)
- Redis hosting for production BullMQ queues
- Subscription billing implementation priority
- Mobile responsiveness requirements

---

## Architecture Decisions

### Data Integrity (2025-08-27)
- Added unique constraints for Plaid items and accounts
- Enforced upsert patterns to prevent duplicates
- Transaction deduplication via `plaid_transaction_id` unique key

### Async Processing (2025-08-27)
- BullMQ for background jobs (plaid, export, alerts, rollover)
- Graceful degradation: queues no-op if Redis unavailable
- Jobs return 202 for pending work, provide polling endpoints

### Auth Pattern (2025-08-27)
- No access token persistence (memory only)
- Rotating refresh tokens with last-used tracking
- Central 401 retry in RTK Query baseQuery

### Plaid Sync Strategy (2025-08-27)
- Handle PRODUCT_NOT_READY with 202 + async backfill
- Store sync cursors per item for incremental updates
- Webhook-driven incremental sync when available

---

## Notes

This index is auto-updated by git hooks when new memory files are added.
