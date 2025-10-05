# Redis Graceful Degradation

## Overview
The application is designed to run without Redis/BullMQ for local development. When Redis is unavailable, queue operations gracefully no-op without crashing or spamming error logs.

## Implementation

### Queue Module (`src/queue/bullmq.js`)

**Connection Handling:**
```javascript
const connection = new IORedis({
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.warn('Redis unavailable - queue operations will be disabled');
      return null; // Stop retrying
    }
    return Math.min(times * 50, 2000);
  }
});
```

**Error Suppression:**
- Silently handles ECONNREFUSED errors (logged once, not spammed)
- Tracks `redisAvailable` flag to determine connection state

**Mock Queue Pattern:**
When Redis unavailable, `getQueue()` returns a mock:
```javascript
{
  add: async () => ({ id: 'no-op' }),
  getJobCounts: async () => ({ waiting: 0, active: 0, completed: 0, failed: 0 })
}
```

**Worker Creation:**
`createWorker()` returns `null` when Redis unavailable (workers don't start).

### Worker Module (`src/worker.js`)

All workers check if they initialized successfully:
```javascript
if (plaidWorker || exportWorker || alertsWorker || rolloverWorker) {
  logger.info('Worker started with available queues');
} else {
  logger.warn('Worker started but Redis unavailable - background jobs disabled');
}
```

### Enqueue Operations

When code calls `enqueue()` without Redis:
```javascript
await enqueue('plaid', 'initial_backfill', { userId, itemId })
// Returns 'no-op' instead of job ID
// Logs: "Queue operation skipped - Redis unavailable"
```

## Impact on Features

### ✅ Still Works (Core Features)
- User authentication
- Account linking (Plaid)
- Transaction fetching (inline sync)
- Budget management
- Manual account entry
- AI assistance
- Export requests (inline processing fallback)

### ⚠️ Degraded (Background Features)
- **Plaid backfill**: Heavy historical sync won't be queued (may timeout if inline)
- **Export jobs**: Large exports may block request (no background processing)
- **Alerts evaluation**: Won't run automatically in background
- **Month rollover**: Won't process in background

### 🔧 Workarounds
Most operations that would queue jobs can fall back to inline processing:

**Example in Plaid Service:**
```javascript
// Instead of: await enqueue('plaid', 'backfill', {...})
// Inline: await PlaidService.historicalBackfill(userId, itemId)
```

## Development vs Production

### Local Development (Redis Optional)
```bash
# Start app without Redis
npm run dev
# Logs: "Redis unavailable - queue operations disabled"
# App works fine for most features
```

### Production (Redis Required)
```bash
# Set Redis URL
export REDIS_URL=redis://prod-redis:6379
# Start app + worker
npm start
node src/worker.js
# Logs: "Redis connected - queue operations enabled"
```

## Testing Redis Graceful Degradation

### Without Redis
```bash
# Ensure Redis is NOT running
sudo systemctl stop redis
# Or just don't start it

# Start backend
cd backend && npm run dev

# Expected logs:
✅ Database connected successfully
📊 Database type: SQLite (Local)
⚠️  Redis unavailable at startup - queue operations disabled
INFO: server started
```

### With Redis
```bash
# Start Redis
docker run -d -p 6379:6379 redis
# Or: sudo systemctl start redis

# Start backend
cd backend && npm run dev

# Expected logs:
✅ Database connected successfully
📊 Database type: SQLite (Local)
✅ Redis connected - queue operations enabled
INFO: server started
```

## Error Patterns

### Before Fix (Bad) ❌
```
[ioredis] Unhandled error event: Error: connect ECONNREFUSED 127.0.0.1:6379
[ioredis] Unhandled error event: Error: connect ECONNREFUSED 127.0.0.1:6379
[ioredis] Unhandled error event: Error: connect ECONNREFUSED 127.0.0.1:6379
... (repeating forever, polluting logs)
```

### After Fix (Good) ✅
```
[2025-10-04 23:59:46.189 -0400] WARN: Redis unavailable at startup - queue operations disabled
[2025-10-04 23:59:46.498 -0400] WARN: Redis unavailable - queue operations will be disabled
... (clean startup, one-time warning)
```

## Related Code

- **Queue adapter**: `src/queue/bullmq.js`
- **Worker process**: `src/worker.js`
- **Plaid service**: `src/services/plaidService.js` (uses enqueue)
- **Export routes**: `src/routes/export.js` (uses enqueue)
- **Alerts engine**: `src/services/alertsEngine.js` (used by worker)
- **Rollover service**: `src/services/rolloverService.js` (used by worker)

## Future Enhancements

**Potential Improvements:**
- [ ] Add health endpoint flag for Redis status (`/api/v1/ops/health`)
- [ ] UI indicator when background jobs unavailable
- [ ] Automatic fallback to inline processing for exports when Redis down
- [ ] Queue job status page shows "Redis unavailable" message
- [ ] Retry queue operations when Redis comes back online

## Architecture Decision

**Why Graceful Degradation?**
- Local development doesn't require full infrastructure
- Reduces developer onboarding friction
- Core features work without queues
- Production can still use queues for heavy workloads
- Follows project instruction: "Code must no-op gracefully if Redis unavailable"
