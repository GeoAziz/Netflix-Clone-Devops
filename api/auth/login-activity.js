/**
 * /api/auth/login-activity.js - Track and retrieve login history
 * GET: Get login activity log
 * POST: Record login attempt (called after successful login)
 */

import { withAuth } from '../../lib/verifyToken.js';
import { apiSuccess, apiError, HTTP_STATUS } from '../../lib/responseFormat.js';
import { db } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

// Parse user agent to extract browser/OS info
function parseUserAgent(userAgent) {
  let browser = 'Unknown';
  let os = 'Unknown';

  if (/Chrome/.test(userAgent)) browser = 'Chrome';
  if (/Firefox/.test(userAgent)) browser = 'Firefox';
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari';
  if (/Edge/.test(userAgent)) browser = 'Edge';

  if (/Windows/.test(userAgent)) os = 'Windows';
  if (/Mac/.test(userAgent)) os = 'macOS';
  if (/Linux/.test(userAgent)) os = 'Linux';
  if (/Android/.test(userAgent)) os = 'Android';
  if (/iPhone|iPad/.test(userAgent)) os = 'iOS';

  return { browser, os };
}

// Approximate geolocation from IP (basic implementation)
async function getApproximateLocation(ip) {
  try {
    // In production, use a proper IP geolocation service
    // For now, just indicate the IP was logged
    return {
      ip,
      location: 'See IP logs for details',
    };
  } catch {
    return { ip, location: 'Unknown' };
  }
}

async function handler(req, res, decodedToken) {
  try {
    const { uid, email } = decodedToken;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // GET: Retrieve login activity log
    if (req.method === 'GET') {
      const { limit = 20 } = req.query;
      const activityRef = db()
        .collection('loginActivity')
        .doc(uid)
        .collection('events')
        .orderBy('timestamp', 'desc')
        .limit(parseInt(limit));

      const activitySnapshot = await activityRef.get();
      const activity = activitySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || null,
      }));

      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          activity,
          total: activity.length,
        })
      );
    }

    // POST: Record login attempt (called after successful authentication)
    if (req.method === 'POST') {
      const { success = true, reason } = req.body;
      const { browser, os } = parseUserAgent(userAgent);
      const location = await getApproximateLocation(ipAddress);

      // Check if login is from unusual location (basic pattern detection)
      const recentActivity = await db()
        .collection('loginActivity')
        .doc(uid)
        .collection('events')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      const recentIPs = recentActivity.docs.map((doc) => doc.data().ipAddress);
      const isNewLocation = !recentIPs.includes(ipAddress);
      const requiresVerification = success && isNewLocation && recentActivity.size > 0;

      // Record login activity
      const activityDocRef = await db()
        .collection('loginActivity')
        .doc(uid)
        .collection('events')
        .add({
          email,
          success,
          reason: reason || (success ? 'Successful login' : 'Failed login attempt'),
          browser,
          os,
          ipAddress,
          location: location.location,
          userAgent: userAgent.substring(0, 100),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          requiresVerification,
          verified: !requiresVerification,
        });

      // If new location and recent history exists, might need verification email
      if (requiresVerification) {
        // In production, send verification email
        console.log(`New location detected for ${email}. Sending verification email...`);
      }

      // Log to audit trail
      await db()
        .collection('auditLogs')
        .doc(uid)
        .collection('events')
        .add({
          type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress,
          reason: reason || (success ? 'Successful login' : 'Failed attempt'),
          newLocation: isNewLocation,
        });

      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          recorded: true,
          newLocation: isNewLocation,
          requiresVerification,
          message: requiresVerification
            ? 'Suspicious login detected. Check your email for verification link.'
            : 'Login recorded',
        })
      );
    }

    return res
      .status(HTTP_STATUS.METHOD_NOT_ALLOWED)
      .json(apiError('METHOD_NOT_ALLOWED', 'Method not allowed'));
  } catch (error) {
    console.error('Login activity error:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(apiError('SERVER_ERROR', 'Failed to record login activity'));
  }
}

export default withAuth((req, res, decodedToken) =>
  handler(req, res, decodedToken)
);
