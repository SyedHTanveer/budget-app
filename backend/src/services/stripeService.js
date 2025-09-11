const Stripe = require('stripe');
const { db } = require('../config/database');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  static async createCustomer(userId, email, name) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      });

      // Store customer ID in database
      await db('users')
        .where({ id: userId })
        .update({ stripe_customer_id: customer.id });

      return customer;
    } catch (error) {
      console.error('Create customer error:', error);
      throw error;
    }
  }

  static async createSubscription(userId, priceId) {
    try {
      const user = await db('users').where({ id: userId }).first();
      
      if (!user.stripe_customer_id) {
        throw new Error('Customer not found');
      }

      const subscription = await stripe.subscriptions.create({
        customer: user.stripe_customer_id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Store subscription in database
      await db('subscriptions').insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: user.stripe_customer_id,
        price_id: priceId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      };
    } catch (error) {
      console.error('Create subscription error:', error);
      throw error;
    }
  }

  static async cancelSubscription(userId) {
    try {
      const subscription = await db('subscriptions')
        .where({ user_id: userId, status: 'active' })
        .first();

      if (!subscription) {
        throw new Error('Active subscription not found');
      }

      const canceledSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: true }
      );

      // Update subscription in database
      await db('subscriptions')
        .where({ id: subscription.id })
        .update({ 
          status: 'canceled',
          canceled_at: new Date(),
          updated_at: new Date()
        });

      return canceledSubscription;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  static async reactivateSubscription(userId) {
    try {
      const subscription = await db('subscriptions')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .first();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const reactivatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: false }
      );

      // Update subscription in database
      await db('subscriptions')
        .where({ id: subscription.id })
        .update({ 
          status: 'active',
          canceled_at: null,
          updated_at: new Date()
        });

      return reactivatedSubscription;
    } catch (error) {
      console.error('Reactivate subscription error:', error);
      throw error;
    }
  }

  static async getSubscription(userId) {
    try {
      const subscription = await db('subscriptions')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .first();

      if (!subscription) {
        return null;
      }

      // Get latest data from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // Update local data
      await db('subscriptions')
        .where({ id: subscription.id })
        .update({
          status: stripeSubscription.status,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000),
          updated_at: new Date()
        });

      return {
        ...subscription,
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000)
      };
    } catch (error) {
      console.error('Get subscription error:', error);
      throw error;
    }
  }

  static async createPaymentIntent(userId, amount, currency = 'usd') {
    try {
      const user = await db('users').where({ id: userId }).first();
      
      if (!user.stripe_customer_id) {
        throw new Error('Customer not found');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        customer: user.stripe_customer_id,
        automatic_payment_methods: { enabled: true },
        metadata: {
          userId
        }
      });

      return paymentIntent;
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  static async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.updateSubscriptionFromWebhook(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.deleteSubscriptionFromWebhook(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleSuccessfulPayment(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handleFailedPayment(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  static async updateSubscriptionFromWebhook(subscription) {
    const userId = await this.getUserIdFromCustomer(subscription.customer);
    if (!userId) return;

    await db('subscriptions')
      .where({ stripe_subscription_id: subscription.id })
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        updated_at: new Date()
      });
  }

  static async deleteSubscriptionFromWebhook(subscription) {
    await db('subscriptions')
      .where({ stripe_subscription_id: subscription.id })
      .update({
        status: 'canceled',
        canceled_at: new Date(),
        updated_at: new Date()
      });
  }

  static async handleSuccessfulPayment(invoice) {
    // Log successful payment, update user credits, etc.
    console.log('Payment succeeded for invoice:', invoice.id);
  }

  static async handleFailedPayment(invoice) {
    // Handle failed payment, notify user, etc.
    console.log('Payment failed for invoice:', invoice.id);
  }

  static async getUserIdFromCustomer(customerId) {
    const user = await db('users')
      .where({ stripe_customer_id: customerId })
      .first();
    return user?.id;
  }
}

module.exports = StripeService;
