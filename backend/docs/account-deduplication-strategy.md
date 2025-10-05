# Account Deduplication Strategy

## Overview
The application uses a multi-layered approach to prevent duplicate account entries, ensuring data integrity and consistent user experience.

## Database Layer (Primary Prevention)

### Unique Constraint
Migration `20250827001400_add_plaid_unique_constraints.js` adds:
```sql
UNIQUE(user_id, plaid_account_id)
```

This constraint prevents duplicate Plaid accounts at the database level. Any attempt to insert a duplicate will fail.

### Upsert Pattern
`plaidService.js` uses Knex's `.onConflict().merge()` pattern:
```javascript
await db('accounts')
  .insert(baseRecord)
  .onConflict(['user_id','plaid_account_id'])
  .merge({ /* fields to update */ })
```

**Benefits:**
- ✅ Idempotent: Re-linking same bank account updates existing record
- ✅ No race conditions: Atomic operation
- ✅ Maintains referential integrity for transactions

## Frontend Layer (Defensive Measure)

### Component-Level Deduplication
`BalancesSection.tsx` deduplicates by account ID before rendering:
```typescript
const uniqueFiltered = Array.from(
  new Map(filteredAccounts.map(a => [a.id, a])).values()
)
```

**Purpose:**
- Defensive against React re-render issues
- Catches any edge cases from state updates
- Ensures clean UI even if backend sends unexpected duplicates

### Debug Logging
```typescript
console.log('[BalancesSection] Fetched accounts:', list.length)
const uniqueIds = new Set(list.map(a => a.id))
if (uniqueIds.size !== list.length) {
  console.warn('[BalancesSection] Duplicate account IDs detected!')
}
```

Helps identify if duplicates are coming from the API (should never happen with proper backend setup).

## Manual Accounts Caveat

**Note:** Manual accounts (not from Plaid) have `plaid_account_id = NULL`.

The unique constraint `(user_id, plaid_account_id)` does NOT prevent duplicates when `plaid_account_id` is NULL because in SQL: `NULL != NULL`.

**Multiple manual accounts with NULL `plaid_account_id` are allowed and expected.**

For example:
- "Chase Checking" (manual entry) ✅
- "Savings Account" (manual entry) ✅  
- "Credit Card" (manual entry) ✅

These are three distinct accounts and should NOT be deduplicated.

## Migration History

1. **Initial Schema** (`20240101000001`): Created accounts table
2. **Unique Constraints** (`20250827001400`): Added unique constraint on `(user_id, plaid_account_id)`
3. **Institution Fields** (`20250827001500`): Added institution metadata for better account identification

## When Duplicates Occur

**Possible Scenarios:**
1. ❌ Pre-migration data (before unique constraint)
2. ❌ Manual SQL inserts bypassing application logic
3. ✅ Manual accounts with NULL plaid_account_id (expected behavior)

**Resolution:**
- Frontend deduplication handles display automatically
- If database duplicates exist (scenario 1-2), manually clean via SQL
- Unique constraint prevents future occurrences

## Testing Duplicate Prevention

### Check for Duplicates (SQL)
```sql
SELECT user_id, plaid_account_id, COUNT(*) as count 
FROM accounts 
WHERE plaid_account_id IS NOT NULL
GROUP BY user_id, plaid_account_id 
HAVING count > 1;
```

### Expected Result
Should return 0 rows (no Plaid account duplicates).

### Manual Accounts
```sql
SELECT user_id, COUNT(*) 
FROM accounts 
WHERE plaid_account_id IS NULL
GROUP BY user_id;
```

Can have multiple rows per user (expected for manual accounts).

## Future Enhancements

**Potential Improvements:**
- [ ] Add unique name check for manual accounts at application level
- [ ] Add "merge accounts" feature for user-facing duplicate resolution
- [ ] Implement soft-delete instead of hard delete (is_active flag already exists)
- [ ] Add audit logging for account creation/deletion

## Related Files

- Backend: `src/services/plaidService.js`
- Backend: `src/routes/accounts.js`
- Backend: `src/migrations/20250827001400_add_plaid_unique_constraints.js`
- Frontend: `src/components/dashboard/BalancesSection.tsx`
