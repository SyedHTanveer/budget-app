const { db } = require('../config/database');
const { v4: uuid } = require('uuid');

class RolloverService {
  static monthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  }

  static async closeMonth(userId, date = new Date()) {
    // Determine previous month period to close
    const periodEnd = new Date(date.getFullYear(), date.getMonth(), 0); // last day previous month
    const periodMonth = this.monthKey(periodEnd);

    // Fetch categories snapshot
    const categories = await db('budget_categories').where({ user_id: userId, is_active: true });

    // Vacation periods overlapping the month being closed (for paused categories exclusion)
    const monthStartDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
    const monthEndDate = periodEnd;
    const monthStart = monthStartDate.toISOString().split('T')[0];
    const monthEnd = monthEndDate.toISOString().split('T')[0];

    const vacations = await db('vacation_periods')
      .where({ user_id: userId })
      .where(function() {
        this.whereBetween('start_date', [monthStart, monthEnd])
          .orWhereBetween('end_date', [monthStart, monthEnd])
          .orWhere(function() { this.where('start_date','<=', monthStart).andWhere('end_date','>=', monthEnd); });
      });

    const pausedCategoryIds = new Set();
    vacations.forEach(v => {
      if (v.paused_categories) {
        try { JSON.parse(v.paused_categories).forEach(id => pausedCategoryIds.add(id)); } catch(_) {}
      }
    });

    // For each category compute leftover for that month
    const tx = await db('transactions')
      .where('user_id', userId)
      .whereNull('deleted_at')
      .where('amount','<',0)
      .where('date','>=', monthStart)
      .where('date','<=', monthEnd);

    const spending = {};
    tx.forEach(t => { spending[t.category] = (spending[t.category] || 0) + Math.abs(parseFloat(t.amount)); });

    const contributions = [];
    for (const cat of categories) {
      if (pausedCategoryIds.has(cat.id)) continue; // skip paused
      const limit = parseFloat(cat.monthly_limit || 0);
      if (!limit) continue;
      const spent = spending[cat.name] || 0;
      const leftover = Math.max(0, limit - spent);
      if (leftover <= 0) continue;
      if (cat.rollover_mode === 'to_savings' && cat.savings_goal_id) {
        contributions.push({ goal_id: cat.savings_goal_id, amount: leftover, source: 'rollover_auto' });
      }
    }

    // Insert goal contributions
    for (const c of contributions) {
      await db('goal_contributions').insert({ id: uuid(), goal_id: c.goal_id, amount: c.amount, source: c.source });
      await db('goals').where({ id: c.goal_id }).increment({ current_amount: c.amount });
    }

    return { period: periodMonth, contributions: contributions.length, totalAmount: contributions.reduce((s,c)=> s + c.amount,0), pausedCategoriesSkipped: pausedCategoryIds.size };
  }
}

module.exports = RolloverService;