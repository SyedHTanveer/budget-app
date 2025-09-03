const express = require('express');
const PlaidService = require('../services/plaidService');
const auth = require('../middleware/auth');

const router = express.Router();

// Create link token for Plaid Link
router.post('/link-token', auth, async (req, res) => {
  try {
    console.log('Creating Plaid link token for user:', req.user.id);
    const linkToken = await PlaidService.createLinkToken(req.user.id);
    console.log('Link token created successfully');
    res.json({ linkToken });
  } catch (error) {
    console.error('Link token error:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Exchange public token and store accounts
router.post('/exchange-token', auth, async (req, res) => {
  try {
    const { publicToken } = req.body;
    console.log('Exchanging public token for user:', req.user.id);
    
    if (!publicToken) {
      return res.status(400).json({ error: 'Public token is required' });
    }

    const result = await PlaidService.exchangePublicToken(req.user.id, publicToken);
    console.log('Token exchange completed. Accounts created:', result.accounts.length, 'status:', result.status);
    if (result.status === 'pending') {
      return res.status(202).json({ status: 'pending' });
    }
    res.json(result);
  } catch (error) {
    // Detect PRODUCT_NOT_READY fallback just in case
    const code = error?.response?.data?.error_code;
    if (code === 'PRODUCT_NOT_READY') {
      return res.status(202).json({ status: 'pending' });
    }
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Sync transactions for user
router.post('/sync-transactions', auth, async (req, res) => {
  try {
    console.log('Syncing transactions for user:', req.user.id);
    const synced = await PlaidService.syncAllUserTransactions(req.user.id);
    console.log(`Successfully synced ${synced} transactions for user:`, req.user.id);
    res.json({ message: `Synced ${synced} transactions` });
  } catch (error) {
    console.error('Sync transactions error:', error);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
});

module.exports = router;
