const express = require('express');
const BudgetEngine = require('../services/budgetEngine');
const auth = require('../middleware/auth');

const router = express.Router();

// Get current budget status
router.get('/status', auth, async (req, res) => {
  try {
    const budget = await BudgetEngine.calculateSafeToSpend(req.user.id);
    res.json(budget);
  } catch (error) {
    console.error('Budget status error:', error);
    res.status(500).json({ error: 'Failed to calculate budget' });
  }
});

// Simulate spending
router.post('/simulate', auth, async (req, res) => {
  try {
    const { amount, category } = req.body;
    const simulation = await BudgetEngine.simulateSpend(req.user.id, amount, category);
    res.json(simulation);
  } catch (error) {
    console.error('Budget simulation error:', error);
    res.status(500).json({ error: 'Failed to simulate spending' });
  }
});

// Check affordability
router.post('/can-afford', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const budget = await BudgetEngine.calculateSafeToSpend(req.user.id);
    
    res.json({
      canAfford: budget.safeToSpend >= amount,
      safeToSpend: budget.safeToSpend,
      requestedAmount: amount,
      remainingAfter: budget.safeToSpend - amount
    });
  } catch (error) {
    console.error('Affordability check error:', error);
    res.status(500).json({ error: 'Failed to check affordability' });
  }
});

// Get user's budget categories
router.get('/categories', auth, async (req, res) => {
  try {
    const { db } = require('../config/database');
    const categories = await db('budget_categories')
      .where({ user_id: req.user.id, is_active: true })
      .orderBy('name');
    
    res.json(categories);
  } catch (error) {
    console.error('Get budget categories error:', error);
    res.status(500).json({ error: 'Failed to fetch budget categories' });
  }
});

// Create/Update budget categories
router.post('/categories', auth, async (req, res) => {
  try {
    const { db } = require('../config/database');
    const { categories } = req.body;
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Categories must be an array' });
    }

    // Start transaction
    await db.transaction(async (trx) => {
      // First, deactivate all existing categories for this user
      await trx('budget_categories')
        .where({ user_id: req.user.id })
        .update({ is_active: false, updated_at: new Date() });

      // Then insert/update the new categories
      for (const category of categories) {
        const categoryData = {
          id: category.id || require('crypto').randomUUID(),
          user_id: req.user.id,
          name: category.name,
          icon_name: category.iconName || 'DollarSign',
          color: category.color || 'bg-gray-100 text-gray-700',
          description: category.description || '',
          monthly_limit: category.monthlyLimit || 0,
          current_spent: 0, // Reset spending
          is_active: true,
          updated_at: new Date()
        };

        // Check if category already exists
        const existing = await trx('budget_categories')
          .where({ user_id: req.user.id, name: category.name })
          .first();

        if (existing) {
          // Update existing
          await trx('budget_categories')
            .where({ id: existing.id })
            .update(categoryData);
        } else {
          // Insert new
          categoryData.created_at = new Date();
          await trx('budget_categories').insert(categoryData);
        }
      }
    });

    // Return updated categories
    const updatedCategories = await db('budget_categories')
      .where({ user_id: req.user.id, is_active: true })
      .orderBy('name');

    res.json({ 
      message: 'Budget categories saved successfully',
      categories: updatedCategories
    });
  } catch (error) {
    console.error('Save budget categories error:', error);
    res.status(500).json({ error: 'Failed to save budget categories' });
  }
});

// Delete a budget category
router.delete('/categories/:id', auth, async (req, res) => {
  try {
    const { db } = require('../config/database');
    
    const deleted = await db('budget_categories')
      .where({ id: req.params.id, user_id: req.user.id })
      .update({ is_active: false, updated_at: new Date() });

    if (!deleted) {
      return res.status(404).json({ error: 'Budget category not found' });
    }

    res.json({ message: 'Budget category deleted successfully' });
  } catch (error) {
    console.error('Delete budget category error:', error);
    res.status(500).json({ error: 'Failed to delete budget category' });
  }
});

// Get spending vs budget for current month
router.get('/categories/spending', auth, async (req, res) => {
  try {
    const { db } = require('../config/database');
    
    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Get budget categories
    const categories = await db('budget_categories')
      .where({ user_id: req.user.id, is_active: true });

    // Get spending by category for current month
    const spending = await db('transactions')
      .where('user_id', req.user.id)
      .where('amount', '<', 0) // Only outgoing transactions
      .where('date', '>=', monthStart)
      .where('date', '<=', monthEnd)
      .select('category')
      .sum('amount as total')
      .groupBy('category');

    // Create spending map
    const spendingMap = {};
    spending.forEach(item => {
      spendingMap[item.category] = Math.abs(parseFloat(item.total));
    });

    // Combine categories with spending
    const result = categories.map(category => ({
      ...category,
      monthlyLimit: parseFloat(category.monthly_limit),
      currentSpent: spendingMap[category.name] || 0,
      remaining: parseFloat(category.monthly_limit) - (spendingMap[category.name] || 0),
      percentUsed: parseFloat(category.monthly_limit) > 0 
        ? ((spendingMap[category.name] || 0) / parseFloat(category.monthly_limit)) * 100 
        : 0
    }));

    res.json(result);
  } catch (error) {
    console.error('Get category spending error:', error);
    res.status(500).json({ error: 'Failed to fetch category spending' });
  }
});

module.exports = router;
