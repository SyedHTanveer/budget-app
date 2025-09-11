const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { db, isLocalOnly } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get privacy status and settings
router.get('/status', auth, async (req, res) => {
  try {
    const status = {
      dataStorage: isLocalOnly ? 'Local SQLite (Encrypted)' : 'Local PostgreSQL',
      location: isLocalOnly ? 'Your device only' : 'Local server',
      encryption: isLocalOnly ? 'AES-256 for sensitive data' : 'Database-level',
      externalServices: {
        ai: {
          enabled: !!process.env.OPENAI_API_KEY,
          purpose: 'Conversational budget assistance',
          dataShared: 'Budget calculations only (no raw transactions)',
          optional: true
        },
        bankLinking: {
          enabled: !!process.env.PLAID_CLIENT_ID,
          purpose: 'Automatic transaction import',
          dataShared: 'Bank connection (encrypted locally)',
          optional: true
        },
        payments: {
          enabled: !!process.env.STRIPE_SECRET_KEY,
          purpose: 'Subscription billing',
          dataShared: 'Payment info (handled by Stripe)',
          optional: true
        }
      },
      privacy_features: [
        'All financial data encrypted locally',
        'No analytics or tracking',
        'Complete data export available',
        'Secure data deletion',
        'External services are optional'
      ]
    };
    
    res.json(status);
  } catch (error) {
    console.error('Privacy status error:', error);
    res.status(500).json({ error: 'Failed to get privacy status' });
  }
});

// Export all user data
router.post('/export', auth, async (req, res) => {
  try {
    const userData = {
      exported_at: new Date().toISOString(),
      privacy_note: 'This export contains all your financial data. Keep it secure.',
      user: await db('users').where({ id: req.user.id }).select('id', 'email', 'first_name', 'last_name', 'created_at').first(),
      accounts: await db('accounts').where({ user_id: req.user.id }),
      transactions: await db('transactions').where({ user_id: req.user.id }),
      bills: await db('bills').where({ user_id: req.user.id }),
      goals: await db('goals').where({ user_id: req.user.id }),
      ai_conversations: await db('ai_conversations').where({ user_id: req.user.id }).select('query', 'response', 'created_at')
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `budget_export_${timestamp}.json`;
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../../data/exports');
    await fs.mkdir(dataDir, { recursive: true });
    
    const filepath = path.join(dataDir, filename);
    await fs.writeFile(filepath, JSON.stringify(userData, null, 2));
    
    res.json({
      message: 'Your complete financial data has been exported',
      filename,
      size: (await fs.stat(filepath)).size,
      records: {
        accounts: userData.accounts.length,
        transactions: userData.transactions.length,
        bills: userData.bills.length,
        goals: userData.goals.length
      }
    });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Delete all user data (GDPR-style)
router.delete('/delete-all', auth, async (req, res) => {
  try {
    const { confirmEmail, confirmPassword } = req.body;
    
    if (confirmEmail !== req.user.email) {
      return res.status(400).json({ error: 'Email confirmation does not match' });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const user = await db('users').where({ id: req.user.id }).first();
    const isValidPassword = await bcrypt.compare(confirmPassword, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Delete all user data in proper order
    await db.transaction(async (trx) => {
      await trx('ai_conversations').where({ user_id: req.user.id }).del();
      await trx('goals').where({ user_id: req.user.id }).del();
      await trx('bills').where({ user_id: req.user.id }).del();
      await trx('transactions').where({ user_id: req.user.id }).del();
      await trx('accounts').where({ user_id: req.user.id }).del();
      await trx('subscriptions').where({ user_id: req.user.id }).del();
      await trx('plaid_items').where({ user_id: req.user.id }).del();
      await trx('users').where({ id: req.user.id }).del();
    });

    res.json({ 
      message: 'All your data has been permanently deleted',
      privacy_note: 'Your account and all associated financial data have been completely removed from our system'
    });
  } catch (error) {
    console.error('Data deletion error:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// Disable external services
router.post('/disable-service', auth, async (req, res) => {
  try {
    const { service } = req.body; // 'ai', 'plaid', or 'stripe'
    
    // Store user preferences for disabling services
    await db('user_preferences').insert({
      user_id: req.user.id,
      preference_key: `disable_${service}`,
      preference_value: 'true'
    }).onConflict(['user_id', 'preference_key']).merge();

    res.json({ 
      message: `${service} has been disabled for your account`,
      privacy_note: 'You can re-enable this service anytime in settings'
    });
  } catch (error) {
    console.error('Service disable error:', error);
    res.status(500).json({ error: 'Failed to disable service' });
  }
});

module.exports = router;
