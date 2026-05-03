import { db } from '../../lib/firebaseAdmin.js';
import { verifyToken } from '../../lib/verifyToken.js';

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

    const userId = user.uid;
    const { reason } = req.body; // Optional reason for cancellation

    // Get current subscription
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    const subscriptionSnap = await subscriptionRef.get();

    if (!subscriptionSnap.exists()) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const subscription = subscriptionSnap.data();

    // Check if already cancelled
    if (subscription.status === 'cancelled') {
      return res.status(400).json({ error: 'Subscription is already cancelled' });
    }

    const now = new Date();

    // Update subscription status to cancelled
    const updatedSubscription = {
      ...subscription,
      status: 'cancelled',
      cancelledAt: now,
      cancellationReason: reason || 'User requested cancellation',
      // Service remains active until renewal date
      accessUntil: subscription.renewalDate,
      updatedAt: now,
    };

    await subscriptionRef.set(updatedSubscription);

    // Log the cancellation
    await db.collection('auditLogs').doc(userId).collection('logs').add({
      action: 'subscription_cancelled',
      planId: subscription.planId,
      timestamp: now,
      details: {
        planName: subscription.planName,
        accessUntil: subscription.renewalDate,
        reason: reason || 'User requested cancellation',
      },
    });

    return res.status(200).json({
      success: true,
      message: `Subscription cancelled. You will have access until ${subscription.renewalDate.toDateString()}.`,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error.message,
    });
  }
}
