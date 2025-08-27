const express = require('express');
const { db } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all user accounts
router.get('/', auth, async (req, res) => {
  try {
    const accounts = await db('accounts')
      .where({ user_id: req.user.id, is_active: true })
      .select('id', 'name', 'type', 'balance', 'currency', 'created_at')
      .orderBy('type')
      .orderBy('name');

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get account by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const account = await db('accounts')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// Update account
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, balance } = req.body;
    
    const [account] = await db('accounts')
      .where({ id: req.params.id, user_id: req.user.id })
      .update({ 
        name, 
        balance,
        updated_at: new Date()
      })
      .returning('*');

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Deactivate account
router.delete('/:id', auth, async (req, res) => {
  try {
    const [account] = await db('accounts')
      .where({ id: req.params.id, user_id: req.user.id })
      .update({ is_active: false })
      .returning('*');

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account deactivated' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
});

module.exports = router;
