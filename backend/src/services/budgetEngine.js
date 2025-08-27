const { db } = require('../config/database');

class BudgetEngine {
  static async calculateSafeToSpend(userId) {
    try {
      // Get user's financial data
      const accounts = await db('accounts').where({ user_id: userId, is_active: true });
      const upcomingBills = await db('bills').where({ 
        user_id: userId, 
        is_paid: false 
      }).where('due_date', '>=', new Date().toISOString().split('T')[0]);
      
      const goals = await db('goals').where({ user_id: userId, is_active: true });
      const pendingTransactions = await db('transactions').where({ 
        user_id: userId, 
        status: 'pending' 
      });

      // Calculate available cash
      const availableCash = accounts
        .filter(acc => acc.type === 'checking' || acc.type === 'savings')
        .reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

      // Expected income (next 30 days)
      const expectedIncome = await this.calculateExpectedIncome(userId);

      // Upcoming bills
      const billsTotal = upcomingBills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);

      // Goal contributions
      const goalsTotal = goals.reduce((sum, goal) => sum + parseFloat(goal.monthly_target || 0), 0);

      // Credit card payments due
      const creditCardDue = accounts
        .filter(acc => acc.type === 'credit')
        .reduce((sum, acc) => sum + Math.max(0, -parseFloat(acc.balance) * 0.02), 0); // 2% minimum payment

      // Pending transactions
      const pendingTotal = pendingTransactions.reduce((sum, txn) => sum + Math.abs(parseFloat(txn.amount)), 0);

      // Safety buffer (configurable, default 10% of monthly income)
      const buffer = expectedIncome * 0.1;

      // Safe to spend calculation
      const safeToSpend = availableCash + expectedIncome - billsTotal - goalsTotal - creditCardDue - pendingTotal - buffer;

      return {
        safeToSpend: Math.max(0, safeToSpend),
        breakdown: {
          availableCash,
          expectedIncome,
          bills: billsTotal,
          goals: goalsTotal,
          creditCardDue,
          pending: pendingTotal,
          buffer
        },
        dailyCap: Math.max(0, safeToSpend / 30), // Rough daily spending cap
        confidence: this.calculateConfidence(expectedIncome, billsTotal)
      };
    } catch (error) {
      console.error('Budget calculation error:', error);
      throw error;
    }
  }

  static async calculateExpectedIncome(userId) {
    // Get recent income patterns
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const incomeTransactions = await db('transactions')
      .where({ user_id: userId, category: 'income' })
      .where('date', '>=', ninetyDaysAgo)
      .orderBy('date', 'desc');

    if (incomeTransactions.length === 0) return 0;

    // Calculate average monthly income
    const totalIncome = incomeTransactions.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
    const monthlyAverage = totalIncome / 3; // 3 months

    return monthlyAverage;
  }

  static calculateConfidence(expectedIncome, bills) {
    // Higher confidence when income > bills by significant margin
    const ratio = expectedIncome / (bills || 1);
    if (ratio > 2) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
  }

  static async simulateSpend(userId, amount, category = 'general') {
    const current = await this.calculateSafeToSpend(userId);
    const afterSpend = {
      ...current,
      safeToSpend: current.safeToSpend - amount,
      dailyCap: (current.safeToSpend - amount) / 30
    };

    return {
      current,
      afterSpend,
      impact: {
        remainingBudget: afterSpend.safeToSpend,
        percentageUsed: (amount / current.safeToSpend) * 100,
        daysOfSpendingLeft: afterSpend.safeToSpend / (current.safeToSpend / 30)
      }
    };
  }
}

module.exports = BudgetEngine;
