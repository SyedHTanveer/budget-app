const express = require('express');
const Stripe = require('stripe');
const StripeService = require('../services/stripeService');
const auth = require('../middleware/auth');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    // Define your subscription plans
    const plans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        description: 'Essential budgeting features',
        price: 4.99,
        priceId: process.env.STRIPE_BASIC_PRICE_ID,
        features: [
          'Bank account linking',
          'Basic budget tracking',
          'Transaction categorization',
          'Monthly spending reports'
        ]
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        description: 'Advanced AI-powered insights',
        price: 9.99,
        priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
        features: [
          'Everything in Basic',
          'AI financial assistant',
          'Advanced forecasting',
          'Goal tracking',
          'Bill reminders',
          'Priority support'
        ]
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        description: 'For serious budget enthusiasts',
        price: 19.99,
        priceId: process.env.STRIPE_PRO_PRICE_ID,
        features: [
          'Everything in Premium',
          'Investment tracking',
          'Tax optimization tips',
          'Family sharing',
          'Custom categories',
          'API access'
        ]
      }
    ];

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get current subscription
router.get('/current', auth, async (req, res) => {
  try {
    const subscription = await StripeService.getSubscription(req.user.id);
    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create subscription
router.post('/create', auth, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Create customer if doesn't exist
    if (!req.user.stripe_customer_id) {
      await StripeService.createCustomer(
        req.user.id,
        req.user.email,
        `${req.user.first_name} ${req.user.last_name}`
      );
    }

    const result = await StripeService.createSubscription(req.user.id, priceId);
    res.json(result);
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const result = await StripeService.cancelSubscription(req.user.id);
    res.json({ message: 'Subscription canceled successfully', subscription: result });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post('/reactivate', auth, async (req, res) => {
  try {
    const result = await StripeService.reactivateSubscription(req.user.id);
    res.json({ message: 'Subscription reactivated successfully', subscription: result });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// Create payment intent for one-time payments
router.post('/payment-intent', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const paymentIntent = await StripeService.createPaymentIntent(req.user.id, amount);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await StripeService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling failed:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// Get billing history
router.get('/billing-history', auth, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    
    if (!user.stripe_customer_id) {
      return res.json({ invoices: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 10
    });

    res.json({ invoices: invoices.data });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({ error: 'Failed to fetch billing history' });
  }
});

module.exports = router;
