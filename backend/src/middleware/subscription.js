const { db } = require('../config/database');

const requireSubscription = (requiredPlan = 'basic') => {
  return async (req, res, next) => {
    try {
      const subscription = await db('subscriptions')
        .where({ user_id: req.user.id, status: 'active' })
        .first();

      if (!subscription) {
        return res.status(403).json({ 
          error: 'Active subscription required',
          code: 'SUBSCRIPTION_REQUIRED'
        });
      }

      // Check if subscription has required plan level
      const planHierarchy = {
        'basic': 1,
        'premium': 2,
        'pro': 3
      };

      const userPlanLevel = planHierarchy[subscription.plan_type] || 0;
      const requiredPlanLevel = planHierarchy[requiredPlan] || 1;

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          error: `${requiredPlan} plan or higher required`,
          code: 'PLAN_UPGRADE_REQUIRED',
          currentPlan: subscription.plan_type,
          requiredPlan
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      res.status(500).json({ error: 'Failed to verify subscription' });
    }
  };
};

const checkSubscriptionLimits = (feature, limit) => {
  return async (req, res, next) => {
    try {
      // Example: Check AI query limits
      if (feature === 'ai_queries') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const queryCount = await db('ai_conversations')
          .where('user_id', req.user.id)
          .where('created_at', '>=', today)
          .count('* as count')
          .first();

        if (parseInt(queryCount.count) >= limit) {
          return res.status(429).json({
            error: 'Daily AI query limit reached',
            code: 'LIMIT_EXCEEDED',
            limit,
            used: parseInt(queryCount.count)
          });
        }
      }

      next();
    } catch (error) {
      console.error('Subscription limits error:', error);
      res.status(500).json({ error: 'Failed to check limits' });
    }
  };
};

module.exports = {
  requireSubscription,
  checkSubscriptionLimits
};
