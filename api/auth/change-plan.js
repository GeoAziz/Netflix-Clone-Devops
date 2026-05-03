import { db } from '../../lib/firebaseAdmin.js';
import { verifyToken } from '../../lib/verifyToken.js';

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
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify token
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.uid;
    const { newPlanId } = req.body;

    // Validate new plan
    if (!PLANS[newPlanId]) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Get current subscription
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    const subscriptionSnap = await subscriptionRef.get();

    if (!subscriptionSnap.exists()) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const currentSubscription = subscriptionSnap.data();

    // Check if same plan
    if (currentSubscription.planId === newPlanId) {
      return res.status(400).json({ error: 'Plan is already selected' });
    }

    const newPlan = PLANS[newPlanId];
    const now = new Date();

    // Update subscription
    const updatedSubscription = {
      ...currentSubscription,
      planId: newPlanId,
      planName: newPlan.name,
      price: newPlan.price,
      updatedAt: now,
      // Keep current renewal date, change takes effect next billing cycle
      planChangeDate: now,
      previousPlanId: currentSubscription.planId,
    };

    await subscriptionRef.set(updatedSubscription);

    // Log the change
    await db.collection('auditLogs').doc(userId).collection('logs').add({
      action: 'plan_changed',
      oldPlanId: currentSubscription.planId,
      newPlanId: newPlanId,
      timestamp: now,
      details: {
        oldPlanName: currentSubscription.planName,
        newPlanName: newPlan.name,
        oldPrice: currentSubscription.price,
        newPrice: newPlan.price,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Plan changed successfully. Change takes effect on next billing cycle.',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Change plan error:', error);
    return res.status(500).json({
      error: 'Failed to change plan',
      details: error.message,
    });
  }
}
