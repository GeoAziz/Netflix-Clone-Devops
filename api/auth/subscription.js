import { db } from '../../lib/firebaseAdmin.js';
import { verifyToken } from '../../lib/verifyToken.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify token
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.uid;

    // Fetch subscription from Firestore
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    const subscriptionSnap = await subscriptionRef.get();

    if (!subscriptionSnap.exists()) {
      return res.status(404).json({
        error: 'No subscription found',
        subscription: null,
      });
    }

    const subscriptionData = subscriptionSnap.data();

    // Convert Firestore timestamps to ISO strings
    const subscription = {
      ...subscriptionData,
      startDate: subscriptionData.startDate?.toDate?.() || subscriptionData.startDate,
      renewalDate: subscriptionData.renewalDate?.toDate?.() || subscriptionData.renewalDate,
      trialEndsAt: subscriptionData.trialEndsAt?.toDate?.() || subscriptionData.trialEndsAt,
      createdAt: subscriptionData.createdAt?.toDate?.() || subscriptionData.createdAt,
      updatedAt: subscriptionData.updatedAt?.toDate?.() || subscriptionData.updatedAt,
    };

    return res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return res.status(500).json({
      error: 'Failed to fetch subscription',
      details: error.message,
    });
  }
}
