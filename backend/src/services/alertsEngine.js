const { db } = require('../config/database');
const { v4: uuid } = require('uuid');
const { logger } = require('../logger');

class AlertsEngine {
  static async evaluateUser(userId) {
    const COOLDOWN_MINUTES = 30;
    const now = Date.now();
    // Fetch active alerts
    const alerts = await db('alerts').where({ user_id: userId, status: 'active' });
    if (!alerts.length) return [];
    const events = [];
    for (const alert of alerts) {
      try {
        if (alert.last_triggered_at) {
          const last = new Date(alert.last_triggered_at).getTime();
          if (now - last < COOLDOWN_MINUTES * 60 * 1000) continue; // skip within cooldown
        }
        const triggered = await this.checkAlert(alert);
        if (triggered) {
          const id = uuid();
            await db('alert_events').insert({ id, alert_id: alert.id, user_id: userId, message: triggered.message });
            await db('alerts').where({ id: alert.id }).update({ last_triggered_at: new Date(), last_state: JSON.stringify(triggered.state), updated_at: new Date() });
            events.push({ alertId: alert.id, ...triggered });
        }
      } catch (err) {
        logger.error({ err, alertId: alert.id, userId }, 'alert evaluation failed');
      }
    }
    return events;
  }

  static async checkAlert(alert) {
    switch (alert.type) {
      case 'balance_low':
        return this.checkBalanceLow(alert);
      case 'category_spend':
        return this.checkCategorySpend(alert);
      case 'safe_to_spend':
        return this.checkSafeToSpend(alert);
      default:
        return null;
    }
  }

  static async checkBalanceLow(alert) {
    const accounts = await db('accounts').where({ user_id: alert.user_id, is_active: true });
    let total = 0;
    accounts.forEach(a => { if (['checking','savings'].includes(a.type)) total += parseFloat(a.balance); });
    const threshold = parseFloat(alert.threshold || 0);
    if (alert.comparison === 'lte' ? total <= threshold : total >= threshold) {
      return { message: `Cash balance ${alert.comparison === 'lte' ? 'at or below' : 'at or above'} ${threshold}`, state: { total } };
    }
    return null;
  }

  static async checkCategorySpend(alert) {
    if (!alert.category_id) return null;
    const category = await db('budget_categories').where({ id: alert.category_id }).first();
    if (!category) return null;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const spendingRow = await db('transactions')
      .where('user_id', alert.user_id)
      .where('category', category.name)
      .where('amount', '<', 0)
      .where('date','>=', monthStart)
      .where('date','<=', monthEnd)
      .sum('amount as total').first();
    const spent = Math.abs(parseFloat(spendingRow.total || 0));
    const threshold = parseFloat(alert.threshold || 0);
    const compare = alert.comparison === 'gte' ? spent >= threshold : spent <= threshold;
    if (compare) {
      return { message: `Category ${category.name} spend ${alert.comparison} ${threshold} (spent ${spent})`, state: { spent } };
    }
    return null;
  }

  static async checkSafeToSpend(alert) {
    // Basic reuse of BudgetEngine
    try {
      const BudgetEngine = require('./budgetEngine');
      const res = await BudgetEngine.calculateSafeToSpend(alert.user_id);
      const safe = parseFloat(res.safeToSpend || 0);
      const threshold = parseFloat(alert.threshold || 0);
      const compare = alert.comparison === 'lte' ? safe <= threshold : safe >= threshold;
      if (compare) {
        return { message: `Safe-to-spend ${alert.comparison} ${threshold} (value ${safe})`, state: { safe } };
      }
      return null;
    } catch (err) {
      logger.error({ err, alertId: alert.id }, 'safe_to_spend check failed');
      return null;
    }
  }
}

module.exports = AlertsEngine;