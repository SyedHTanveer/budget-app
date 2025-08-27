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

      // Get accounts
      const accountsResponse = await client.accountsGet({
        access_token: accessToken,
      });
      console.log('Plaid Accounts Response:', JSON.stringify(accountsResponse.data, null, 2));

      // Store encrypted access token for privacy
      const [item] = await db('plaid_items')
        .insert({
          user_id: userId,
          item_id: itemId,
          access_token: encrypt(accessToken), // Encrypt sensitive data
        })
        .returning('*');

      // Store accounts
      const accounts = [];
      for (const account of accountsResponse.data.accounts) {
        const [dbAccount] = await db('accounts')
          .insert({
            user_id: userId,
            plaid_account_id: account.account_id,
            name: account.name,
            type: this.mapAccountType(account.type),
            balance: account.balances.current || 0,
            currency: account.balances.iso_currency_code || 'USD',
          })
          .returning('*');
        
        accounts.push(dbAccount);
      }

      // Sync initial transactions
      await this.syncTransactions(userId, accessToken, null, false); // false = don't decrypt, it's fresh

      return { item, accounts };
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
}

module.exports = PlaidService;
