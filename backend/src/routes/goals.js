const express = require('express');
const { v4: uuid } = require('uuid');
const { db } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// List goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await db('goals').where({ user_id: req.user.id, is_active: true }).orderBy('created_at','asc');
    res.json({ goals });
  } catch (e) {
    console.error('List goals error', e);
    res.status(500).json({ error: 'Failed to list goals' });
  }
});

// Create goal
router.post('/', auth, async (req, res) => {
  try {
    const { name, target_amount, current_amount = 0, monthly_target, target_date, priority = 'medium' } = req.body;
    if (!name || !target_amount) return res.status(400).json({ error: 'name and target_amount required' });
    const goal = {
      id: uuid(),
      user_id: req.user.id,
      name,
      target_amount,
      current_amount,
      monthly_target: monthly_target || null,
      target_date: target_date || null,
      priority
    };
    await db('goals').insert(goal);
    res.status(201).json({ goal });
  } catch (e) {
    console.error('Create goal error', e);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {}; ['name','target_amount','current_amount','monthly_target','target_date','is_active','priority'].forEach(f => { if (req.body[f] !== undefined) patch[f] = req.body[f]; });
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'No fields to update' });
    patch.updated_at = new Date().toISOString();
    const updated = await db('goals').where({ id, user_id: req.user.id }).update(patch);
    if (!updated) return res.status(404).json({ error: 'Goal not found' });
    const goal = await db('goals').where({ id }).first();
    res.json({ goal });
  } catch (e) {
    console.error('Update goal error', e);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Contribute to goal (increment current_amount)
router.post('/:id/contribute', auth, async (req, res) => {
  try {
    const { id } = req.params; const { amount } = req.body;
    const inc = parseFloat(amount);
    if (!inc || inc <= 0) return res.status(400).json({ error: 'Positive amount required' });
    const exists = await db('goals').where({ id, user_id: req.user.id }).first();
    if (!exists) return res.status(404).json({ error: 'Goal not found' });
    await db('goals').where({ id }).increment({ current_amount: inc });
    const goal = await db('goals').where({ id }).first();
    res.json({ goal });
  } catch (e) {
    console.error('Contribute goal error', e);
    res.status(500).json({ error: 'Failed to contribute to goal' });
  }
});

// Delete (soft deactivate) goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db('goals').where({ id, user_id: req.user.id }).update({ is_active: false, updated_at: new Date().toISOString() });
    if (!updated) return res.status(404).json({ error: 'Goal not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete goal error', e);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
