import { db } from '../../lib/firebaseAdmin.js';
import { verifyToken } from '../../lib/verifyToken.js';
import { format } from 'date-fns';

// Plan configuration
const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    currency: 'USD',
    billingPeriod: 'month',
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    price: 15.49,
    currency: 'USD',
    billingPeriod: 'month',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 22.99,
    currency: 'USD',
    billingPeriod: 'month',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify token
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId, planId } = req.body;

    // Verify user can only modify their own subscription
    if (user.uid !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Validate plan
    if (!PLANS[planId]) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const plan = PLANS[planId];
    const now = new Date();
    const renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create subscription document in Firestore
    const subscriptionData = {
      userId,
      planId,
      planName: plan.name,
      price: plan.price,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      startDate: now,
      renewalDate: renewalDate,
      status: 'active',
      trialEndsAt: null,
      createdAt: now,
      updatedAt: now,
    };

    // Save to Firestore
    await db.collection('subscriptions').doc(userId).set(subscriptionData);

    // Also create an audit log
    await db.collection('auditLogs').doc(userId).collection('logs').add({
      action: 'subscription_created',
      planId,
      timestamp: now,
      details: { planName: plan.name, price: plan.price },
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: subscriptionData,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({
      error: 'Failed to create subscription',
      details: error.message,
    });
  }
}
