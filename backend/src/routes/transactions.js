const express = require('express');
const { db } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get transactions with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      category, 
      account_id, 
      start_date, 
      end_date 
    } = req.query;

    let query = db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .where('transactions.user_id', req.user.id)
      .select(
        'transactions.*',
        'accounts.name as account_name',
        'accounts.type as account_type'
      );

    // Apply filters
    if (category) {
      query = query.where('transactions.category', category);
    }
    if (account_id) {
      query = query.where('transactions.account_id', account_id);
    }
    if (start_date) {
      query = query.where('transactions.date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('transactions.date', '<=', end_date);
    }

    // Get total count
    const totalQuery = query.clone();
    const total = await totalQuery.count('* as count').first();

    // Apply pagination
    const offset = (page - 1) * limit;
    const transactions = await query
      .orderBy('transactions.date', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Update transaction category
router.put('/:id/category', auth, async (req, res) => {
  try {
    const { category, subcategory } = req.body;
    
    const [transaction] = await db('transactions')
      .where({ id: req.params.id, user_id: req.user.id })
      .update({ 
        category,
        subcategory,
        updated_at: new Date()
      })
      .returning('*');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction category error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Get spending by category
router.get('/spending-by-category', auth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = db('transactions')
      .where('user_id', req.user.id)
      .where('amount', '<', 0); // Only outgoing transactions

    if (start_date) {
      query = query.where('date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('date', '<=', end_date);
    }

    const spending = await query
      .select('category')
      .sum('amount as total')
      .groupBy('category')
      .orderBy('total', 'asc');

    res.json(spending.map(item => ({
      category: item.category,
      total: Math.abs(parseFloat(item.total))
    })));
  } catch (error) {
    console.error('Get spending by category error:', error);
    res.status(500).json({ error: 'Failed to fetch spending data' });
  }
});

module.exports = router;
