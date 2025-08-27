// DELETE THIS FILE - functionality moved to privacyRoutes
const path = require('path');
const crypto = require('crypto');
const { db, encrypt, decrypt, isLocalOnly } = require('../config/database');

class LocalOnlyService {
  static async ensureDataDirectory() {
    const dataDir = path.join(__dirname, '../../data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    return dataDir;
  }

  static async exportUserData(userId) {
    if (!isLocalOnly) {
      throw new Error('Data export only available in local-only mode');
    }

    const userData = {
      user: await db('users').where({ id: userId }).first(),
      accounts: await db('accounts').where({ user_id: userId }),
      transactions: await db('transactions').where({ user_id: userId }),
      bills: await db('bills').where({ user_id: userId }),
      goals: await db('goals').where({ user_id: userId }),
      conversations: await db('ai_conversations').where({ user_id: userId })
    };

    // Remove sensitive data
    delete userData.user.password_hash;
    delete userData.user.stripe_customer_id;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `budget_export_${timestamp}.json`;
    const filepath = path.join(await this.ensureDataDirectory(), filename);

    await fs.writeFile(filepath, JSON.stringify(userData, null, 2));
    return { filepath, filename };
  }

  static async importUserData(userId, filePath) {
    if (!isLocalOnly) {
      throw new Error('Data import only available in local-only mode');
    }

    const fileData = await fs.readFile(filePath, 'utf8');
    const userData = JSON.parse(fileData);

    // Clear existing data
    await db.transaction(async (trx) => {
      await trx('ai_conversations').where({ user_id: userId }).del();
      await trx('goals').where({ user_id: userId }).del();
      await trx('bills').where({ user_id: userId }).del();
      await trx('transactions').where({ user_id: userId }).del();
      await trx('accounts').where({ user_id: userId }).del();

      // Import data with new user ID
      if (userData.accounts?.length) {
        for (const account of userData.accounts) {
          const [newAccount] = await trx('accounts').insert({
            ...account,
            id: undefined, // Let DB generate new ID
            user_id: userId
          }).returning('*');

          // Update transaction account references
          const accountTransactions = userData.transactions?.filter(t => t.account_id === account.id);
          if (accountTransactions?.length) {
            await trx('transactions').insert(
              accountTransactions.map(t => ({
                ...t,
                id: undefined,
                user_id: userId,
                account_id: newAccount.id
              }))
            );
          }
        }
      }

      if (userData.bills?.length) {
        await trx('bills').insert(
          userData.bills.map(b => ({ ...b, id: undefined, user_id: userId }))
        );
      }

      if (userData.goals?.length) {
        await trx('goals').insert(
          userData.goals.map(g => ({ ...g, id: undefined, user_id: userId }))
        );
      }
    });

    return { message: 'Data imported successfully' };
  }

  static async deleteAllUserData(userId) {
    if (!isLocalOnly) {
      throw new Error('Complete data deletion only available in local-only mode');
    }

    await db.transaction(async (trx) => {
      await trx('ai_conversations').where({ user_id: userId }).del();
      await trx('goals').where({ user_id: userId }).del();
      await trx('bills').where({ user_id: userId }).del();
      await trx('transactions').where({ user_id: userId }).del();
      await trx('accounts').where({ user_id: userId }).del();
      await trx('subscriptions').where({ user_id: userId }).del();
      await trx('plaid_items').where({ user_id: userId }).del();
      await trx('users').where({ id: userId }).del();
    });

    return { message: 'All user data deleted permanently' };
  }

  static async getPrivacyStatus() {
    return {
      localOnlyMode: isLocalOnly,
      databaseType: isLocalOnly ? 'SQLite (Local)' : 'PostgreSQL',
      dataLocation: isLocalOnly ? 'Local file system' : 'Database server',
      encryption: isLocalOnly ? 'AES-256 (Local)' : 'Database-level',
      cloudServices: {
        plaid: process.env.PLAID_CLIENT_ID ? 'Configured (Optional)' : 'Disabled',
        openai: process.env.OPENAI_API_KEY ? 'Configured (Optional)' : 'Disabled',
        stripe: process.env.STRIPE_SECRET_KEY ? 'Configured (Optional)' : 'Disabled'
      }
    };
  }
}

module.exports = LocalOnlyService;
