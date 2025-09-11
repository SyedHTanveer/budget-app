const { PlaidApi, Configuration, PlaidEnvironments } = require('plaid');
const { db, encrypt, decrypt } = require('../config/database');

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

class PlaidService {
  static async createLinkToken(userId) {
    // Check if Plaid is enabled
    if (!process.env.PLAID_CLIENT_ID) {
      throw new Error('Bank linking is disabled for privacy. You can manually add accounts or enable Plaid in settings.');
    }

    try {
      const request = {
        user: {
          client_user_id: userId,
        },
        client_name: 'Budget App',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      };

      const response = await client.linkTokenCreate(request);
      console.log('Plaid Link Token Response:', JSON.stringify(response.data, null, 2));
      return response.data.link_token;
    } catch (error) {
      console.error('Plaid link token error:', error);
      throw error;
    }
  }

  static async exchangePublicToken(userId, publicToken) {
    try {
      // Exchange public token for access token
      const exchangeResponse = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });
      console.log('Plaid Token Exchange Response:', JSON.stringify(exchangeResponse.data, null, 2));

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      // Fetch accounts (also contains item + institution metadata)

      // Get accounts
      const accountsResponse = await client.accountsGet({
        access_token: accessToken,
      });
      console.log('Plaid Accounts Response:', JSON.stringify(accountsResponse.data, null, 2));

      const institutionId = accountsResponse.data.item?.institution_id || null;
      const institutionName = accountsResponse.data.item?.institution_name || null;

      // Institution-level dedupe: if this user already linked this institution, short-circuit
      if (institutionId) {
        const existingItem = await db('plaid_items').where({ user_id: userId, institution_id: institutionId }).first();
        if (existingItem) {
          const existingAccounts = await db('accounts').where({ user_id: userId, institution_id: institutionId }).orderBy('name');
          return { status: 'already_linked', accounts: existingAccounts, item: existingItem };
        }
      }

      // Store encrypted access token for privacy
      let item;
      try {
        [item] = await db('plaid_items')
          .insert({
            user_id: userId,
            item_id: itemId,
            access_token: encrypt(accessToken), // Encrypt sensitive data
            institution_id: institutionId,
            institution_name: institutionName
          })
          .returning('*');
      } catch (e) {
        // Handle SQLite returning limitation or unique constraint on item_id (re-link same item)
        const exists = await db('plaid_items').where({ item_id: itemId }).first();
        if (exists) {
          await db('plaid_items').where({ item_id: itemId }).update({
            access_token: encrypt(accessToken),
            institution_id: institutionId,
            institution_name: institutionName,
            updated_at: new Date()
          });
          item = await db('plaid_items').where({ item_id: itemId }).first();
        } else {
          throw e;
        }
      }

      // Store / upsert accounts with extended metadata
      const accounts = [];
  const itemInstitutionName = institutionName;
  const itemInstitutionId = institutionId;
      for (const account of accountsResponse.data.accounts) {
        const baseRecord = {
          user_id: userId,
          plaid_account_id: account.account_id,
          name: account.name,
          official_name: account.official_name || null,
          institution_name: itemInstitutionName || null,
          institution_id: itemInstitutionId || null,
          item_id: itemId,
          type: this.mapAccountType(account.type),
          subtype: account.subtype || null,
          mask: account.mask || null,
          balance: account.balances.current || 0,
          available_balance: account.balances.available != null ? account.balances.available : null,
          currency: account.balances.iso_currency_code || 'USD',
          raw_plaid_meta: JSON.stringify(account)
        };
        let dbAccount;
        try {
          [dbAccount] = await db('accounts')
            .insert(baseRecord)
            .onConflict(['user_id','plaid_account_id'])
            .merge({
              name: baseRecord.name,
              official_name: baseRecord.official_name,
              institution_name: baseRecord.institution_name,
              institution_id: baseRecord.institution_id,
              item_id: baseRecord.item_id,
              type: baseRecord.type,
              subtype: baseRecord.subtype,
              mask: baseRecord.mask,
              balance: baseRecord.balance,
              available_balance: baseRecord.available_balance,
              currency: baseRecord.currency,
              raw_plaid_meta: baseRecord.raw_plaid_meta,
              updated_at: new Date()
            })
            .returning('*');
        } catch (e) {
          if (e.message && e.message.includes('RETURNING')) {
            await db('accounts')
              .insert(baseRecord)
              .onConflict(['user_id','plaid_account_id'])
              .merge({
                name: baseRecord.name,
                official_name: baseRecord.official_name,
                institution_name: baseRecord.institution_name,
                institution_id: baseRecord.institution_id,
                item_id: baseRecord.item_id,
                type: baseRecord.type,
                subtype: baseRecord.subtype,
                mask: baseRecord.mask,
                balance: baseRecord.balance,
                available_balance: baseRecord.available_balance,
                currency: baseRecord.currency,
                raw_plaid_meta: baseRecord.raw_plaid_meta,
                updated_at: new Date()
              });
            dbAccount = await db('accounts').where({ user_id: userId, plaid_account_id: account.account_id }).first();
          } else {
            throw e;
          }
        }
        accounts.push(dbAccount);
      }

      // Attempt initial lightweight transaction sync; handle PRODUCT_NOT_READY gracefully
      try {
  await this.syncTransactions(userId, accessToken, null, false); // false = already decrypted
  return { item, accounts, status: 'complete' };
      } catch (err) {
        const code = err?.response?.data?.error_code;
        if (code === 'PRODUCT_NOT_READY') {
          // Queue background sync (placeholder – no queue implementation yet)
          return { item, accounts, status: 'pending' };
        }
        throw err;
      }
    } catch (error) {
      console.error('Plaid token exchange error:', error);
      throw error;
    }
  }

  static async syncTransactions(userId, accessToken, startDate = null, shouldDecrypt = true) {
    // Only decrypt if this token came from the database
    const decryptedToken = shouldDecrypt ? decrypt(accessToken) : accessToken;
    
    try {
      const endDate = new Date();
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const request = {
        access_token: decryptedToken,
        start_date: start.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      };

      const response = await client.transactionsGet(request);
      console.log('Plaid Transactions Response:', JSON.stringify({
        total_transactions: response.data.total_transactions,
        transactions_count: response.data.transactions.length,
        accounts: response.data.accounts.map(acc => ({ id: acc.account_id, name: acc.name })),
        transactions: response.data.transactions.slice(0, 3) // Log first 3 transactions as sample
      }, null, 2));
      
      const transactions = response.data.transactions;

      // Get user's accounts to map Plaid account IDs to our account IDs
      const userAccounts = await db('accounts')
        .where({ user_id: userId })
        .select('id', 'plaid_account_id');

      const accountMap = {};
      userAccounts.forEach(acc => {
        accountMap[acc.plaid_account_id] = acc.id;
      });

      // Store transactions
      for (const transaction of transactions) {
        const accountId = accountMap[transaction.account_id];
        if (!accountId) continue;

        // Check if transaction already exists
        const existing = await db('transactions')
          .where({ plaid_transaction_id: transaction.transaction_id })
          .first();

        if (!existing) {
          await db('transactions').insert({
            user_id: userId,
            account_id: accountId,
            plaid_transaction_id: transaction.transaction_id,
            amount: -transaction.amount, // Plaid uses negative for outgoing
            description: transaction.name,
            category: transaction.category?.[0] || 'other',
            subcategory: transaction.category?.[1],
            merchant_name: transaction.merchant_name,
            date: transaction.date,
          });
        }
      }

      return transactions.length;
    } catch (error) {
      console.error('Transaction sync error:', error);
      throw error;
    }
  }

  static mapAccountType(plaidType) {
    const typeMap = {
      'depository': 'checking',
      'credit': 'credit',
      'investment': 'investment',
      'loan': 'loan'
    };
    return typeMap[plaidType] || 'other';
  }

  static async syncAllUserTransactions(userId) {
    try {
      const items = await db('plaid_items')
        .where({ user_id: userId })
        .select('access_token');

      let totalSynced = 0;
      for (const item of items) {
        const synced = await this.syncTransactions(userId, item.access_token);
        totalSynced += synced;
      }

      return totalSynced;
    } catch (error) {
      console.error('Sync all transactions error:', error);
      throw error;
    }
  }

  // Perform a historical backfill (90 days) then switch to incremental sync
  static async historicalBackfill(userId, itemId) {
    try {
      const item = await db('plaid_items').where({ user_id: userId, item_id: itemId }).first();
      if (!item) return { added: 0 };
      const accessToken = decrypt(item.access_token);
      const endDate = new Date();
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      try {
        await this.syncTransactions(userId, accessToken, startDate, false);
      } catch (err) {
        if (err?.response?.data?.error_code === 'PRODUCT_NOT_READY') {
          // Let caller treat as pending; nothing added yet
          return { added: 0, status: 'pending' };
        }
        throw err;
      }
      return { added: 1, status: 'complete' };
    } catch (e) {
      console.error('historicalBackfill error', e);
      throw e;
    }
  }

  // Incremental sync using transactionsSync endpoint storing a cursor
  static async syncIncremental(userId, itemId) {
    const item = await db('plaid_items').where({ user_id: userId, item_id: itemId }).first();
    if (!item) return { added: 0, updated: 0 };
    const accessToken = decrypt(item.access_token);
    let hasMore = true;
    let cursorRow = await db('plaid_sync_state').where({ item_id: itemId }).first();
    let cursor = cursorRow?.cursor || null;
    let added = 0;
    let removed = 0;
    try {
      while (hasMore) {
        const resp = await client.transactionsSync({ access_token: accessToken, cursor });
        const { added: newAdded, removed: removedList, next_cursor, has_more } = resp.data;
        // Map account ids
        const userAccounts = await db('accounts').where({ user_id: userId }).select('id','plaid_account_id');
        const accMap = {}; userAccounts.forEach(a => accMap[a.plaid_account_id] = a.id);
        for (const tx of newAdded) {
          const accountId = accMap[tx.account_id];
          if (!accountId) continue;
          try {
            await db('transactions').insert({
              user_id: userId,
              account_id: accountId,
              plaid_transaction_id: tx.transaction_id,
              amount: -tx.amount,
              description: tx.name,
              category: tx.category?.[0] || 'other',
              subcategory: tx.category?.[1],
              merchant_name: tx.merchant_name,
              date: tx.date,
            });
            added++;
          } catch (e) {
            // ignore duplicates due to unique constraint
          }
        }
        for (const r of removedList) {
          await db('transactions').where({ plaid_transaction_id: r.transaction_id }).update({ removed: true, updated_at: new Date() }).catch(()=>{});
          removed++;
        }
        cursor = next_cursor;
        hasMore = has_more;
      }
      if (cursorRow) {
        await db('plaid_sync_state').where({ item_id: itemId }).update({ cursor, last_synced_at: new Date(), updated_at: new Date() });
      } else {
        await db('plaid_sync_state').insert({ id: itemId, item_id: itemId, user_id: userId, cursor, last_synced_at: new Date() });
      }
      return { added, removed };
    } catch (err) {
      if (err?.response?.data?.error_code === 'PRODUCT_NOT_READY') {
        return { added, removed, status: 'pending' };
      }
      throw err;
    }
  }
}

module.exports = PlaidService;
