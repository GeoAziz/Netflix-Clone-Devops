/**
 * Consolidated Auth Handler
 * Routes all auth operations to a single serverless function
 * Handles: 2fa-setup, email-verification, password-reset, login-activity, devices, profile-pin, create-profile, subscribe, subscription, change-plan, cancel-subscription
 */

import { withAuth } from '../../lib/verifyToken.js';
import { apiSuccess, apiError, HTTP_STATUS } from '../../lib/responseFormat.js';
import { db } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import crypto from 'crypto';

// ============================================
// 2FA Setup Handlers
// ============================================

function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

async function handle2FA(req, res, decodedToken) {
  const { uid } = decodedToken;
  
  if (req.method === 'GET') {
    const mfaRef = db().collection('mfaSettings').doc(uid);
    const mfaDoc = await mfaRef.get();

    if (!mfaDoc.exists) {
      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          enabled: false,
          backupCodesCount: 0,
        })
      );
    }

    const mfaData = mfaDoc.data();
    return res.status(HTTP_STATUS.OK).json(
      apiSuccess({
        enabled: mfaData.enabled || false,
        backupCodesCount: (mfaData.backupCodes || []).length,
      })
    );
  }

  if (req.method === 'POST') {
    const secret = generateSecret();
    const backupCodes = generateBackupCodes();

    await db().collection('mfaSettings').doc(uid).set({
      secret,
      backupCodes,
      enabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(HTTP_STATUS.OK).json(
      apiSuccess({
        secret,
        backupCodes,
        qrCodeUrl: `otpauth://totp/Netflix:${uid}?secret=${secret}&issuer=Netflix`,
      })
    );
  }

  if (req.method === 'DELETE') {
    await db().collection('mfaSettings').doc(uid).delete();
    return res.status(HTTP_STATUS.OK).json(apiSuccess({ message: 'MFA disabled' }));
  }

  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_METHOD', 'Method not allowed'));
}

// ============================================
// Email Verification Handlers
// ============================================

async function handleEmailVerification(req, res, decodedToken) {
  const { uid } = decodedToken;

  if (req.method === 'POST') {
    const { email } = req.body;
    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('MISSING_EMAIL', 'Email required'));
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await db().collection('emailVerification').doc(uid).set({
      email,
      token: verificationToken,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // In production: send email with verification link
    return res.status(HTTP_STATUS.OK).json(apiSuccess({ message: 'Verification email sent' }));
  }

  if (req.method === 'PUT') {
    const { token } = req.body;
    const verificationDoc = await db().collection('emailVerification').doc(uid).get();
    
    if (!verificationDoc.exists) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiError('NOT_FOUND', 'Verification not found'));
    }

    if (verificationDoc.data().token !== token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_TOKEN', 'Invalid verification token'));
    }

    await db().collection('emailVerification').doc(uid).update({ verified: true });
    return res.status(HTTP_STATUS.OK).json(apiSuccess({ message: 'Email verified' }));
  }

  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_METHOD', 'Method not allowed'));
}

// ============================================
// Password Reset Handlers
// ============================================

async function handlePasswordReset(req, res) {
  if (req.method === 'POST') {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_EMAIL', 'Valid email required'));
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const usersRef = db().collection('users').where('email', '==', email);
    const usersSnapshot = await usersRef.get();

    if (!usersSnapshot.empty) {
      const uid = usersSnapshot.docs[0].id;
      await db().collection('passwordReset').doc(uid).set({
        tokenHash,
        email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(HTTP_STATUS.OK).json(
      apiSuccess({ message: 'If an account exists with that email, a password reset link has been sent.' })
    );
  }

  if (req.method === 'PUT') {
    const { uid, token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        apiError('INVALID_PASSWORD', 'Password must be at least 8 characters')
      );
    }

    const resetDoc = await db().collection('passwordReset').doc(uid).get();
    if (!resetDoc.exists) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiError('NOT_FOUND', 'Reset token not found'));
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (resetDoc.data().tokenHash !== tokenHash) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_TOKEN', 'Invalid reset token'));
    }

    await admin.auth().updateUser(uid, { password: newPassword });
    await db().collection('passwordReset').doc(uid).delete();

    return res.status(HTTP_STATUS.OK).json(apiSuccess({ message: 'Password reset successfully' }));
  }

  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_METHOD', 'Method not allowed'));
}

// ============================================
// Login Activity Handlers
// ============================================

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

async function handleLoginActivity(req, res, decodedToken) {
  const { uid } = decodedToken;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

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

    return res.status(HTTP_STATUS.OK).json(apiSuccess({ activity, total: activity.length }));
  }

  if (req.method === 'POST') {
    const { browser, os } = parseUserAgent(userAgent);

    const recentActivity = await db()
      .collection('loginActivity')
      .doc(uid)
      .collection('events')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    await db().collection('loginActivity').doc(uid).collection('events').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      browser,
      os,
      ipAddress,
      success: true,
    });

    return res.status(HTTP_STATUS.OK).json(apiSuccess({ message: 'Login activity recorded' }));
  }

  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_METHOD', 'Method not allowed'));
}

// ============================================
// Devices Handlers
// ============================================

async function handleDevices(req, res, decodedToken) {
  const { uid } = decodedToken;

  if (req.method === 'GET') {
    const devicesSnapshot = await db()
      .collection('users')
      .doc(uid)
      .collection('devices')
      .orderBy('lastUsed', 'desc')
      .get();

    const devices = devicesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(HTTP_STATUS.OK).json(apiSuccess({ devices }));
  }

  if (req.method === 'POST') {
    const { deviceName, deviceFingerprint } = req.body;

    const docRef = await db()
      .collection('users')
      .doc(uid)
      .collection('devices')
      .add({
        deviceName,
        deviceFingerprint,
        trusted: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      });

    return res.status(HTTP_STATUS.CREATED).json(apiSuccess({ id: docRef.id, message: 'Device added' }));
  }

  if (req.method === 'DELETE') {
    const { deviceId } = req.body;
    await db().collection('users').doc(uid).collection('devices').doc(deviceId).delete();
    return res.status(HTTP_STATUS.OK).json(apiSuccess({ message: 'Device removed' }));
  }

  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_METHOD', 'Method not allowed'));
}

// ============================================
// Profile PIN Handlers
// ============================================

async function handleProfilePin(req, res, decodedToken) {
  const { uid } = decodedToken;

  if (req.method === 'POST') {
    const { pin } = req.body;

    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_PIN', 'PIN must be 4 digits'));
    }

    const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');
    await db().collection('profilePIN').doc(uid).set({ pin: hashedPin });

    return res.status(HTTP_STATUS.OK).json(apiSuccess({ message: 'PIN set successfully' }));
  }

  if (req.method === 'GET') {
    const pinDoc = await db().collection('profilePIN').doc(uid).get();
    return res.status(HTTP_STATUS.OK).json(apiSuccess({ set: pinDoc.exists }));
  }

  if (req.method === 'DELETE') {
    await db().collection('profilePIN').doc(uid).delete();
    return res.status(HTTP_STATUS.OK).json(apiSuccess({ message: 'PIN removed' }));
  }

  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_METHOD', 'Method not allowed'));
}

// ============================================
// Create Profile Handlers
// ============================================

async function handleCreateProfile(req, res, decodedToken) {
  const { uid } = decodedToken;

  if (req.method === 'POST') {
    const { profileName, avatar } = req.body;

    if (!profileName) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('MISSING_NAME', 'Profile name required'));
    }

    const docRef = await db()
      .collection('users')
      .doc(uid)
      .collection('profiles')
      .add({
        name: profileName,
        avatar: avatar || 'default',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return res.status(HTTP_STATUS.CREATED).json(apiSuccess({ id: docRef.id }));
  }

  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_METHOD', 'Only POST allowed'));
}

// ============================================
// Subscription Handlers
// ============================================

async function handleSubscription(req, res, decodedToken) {
  const { uid } = decodedToken;

  if (req.method === 'GET') {
    const subDoc = await db().collection('subscriptions').doc(uid).get();

    if (!subDoc.exists) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(apiError('NOT_FOUND', 'No subscription found'));
    }

    return res.status(HTTP_STATUS.OK).json(apiSuccess(subDoc.data()));
  }

  if (req.method === 'POST') {
    const { plan, paymentMethodId } = req.body;

    if (!plan || !['basic', 'standard', 'premium'].includes(plan)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_PLAN', 'Invalid subscription plan'));
    }

    await db().collection('subscriptions').doc(uid).set({
      plan,
      status: 'active',
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return res.status(HTTP_STATUS.CREATED).json(apiSuccess({ message: 'Subscription created' }));
  }

  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_METHOD', 'Method not allowed'));
}

// ============================================
// Change Plan Handlers
// ============================================

async function handleChangePlan(req, res, decodedToken) {
  const { uid } = decodedToken;

  if (req.method === 'PUT') {
    const { newPlan } = req.body;

    if (!newPlan || !['basic', 'standard', 'premium'].includes(newPlan)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_PLAN', 'Invalid plan'));
    }

    await db().collection('subscriptions').doc(uid).update({ plan: newPlan });
    return res.status(HTTP_STATUS.OK).json(apiSuccess({ message: 'Plan updated' }));
  }

  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_METHOD', 'Only PUT allowed'));
}

// ============================================
// Cancel Subscription Handlers
// ============================================

async function handleCancelSubscription(req, res, decodedToken) {
  const { uid } = decodedToken;

  if (req.method === 'POST') {
    const { reason } = req.body;

    await db().collection('subscriptions').doc(uid).update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancellationReason: reason || 'No reason provided',
    });

    return res.status(HTTP_STATUS.OK).json(apiSuccess({ message: 'Subscription cancelled' }));
  }

  return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_METHOD', 'Only POST allowed'));
}

// ============================================
// Main Router
// ============================================

async function authHandler(req, res, decodedToken) {
  // Extract action from URL path: /api/auth/[action] -> action
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const action = pathSegments[pathSegments.length - 1];

  switch (action) {
    case '2fa-setup':
      return handle2FA(req, res, decodedToken);
    case 'email-verification':
      return handleEmailVerification(req, res, decodedToken);
    case 'password-reset':
      return handlePasswordReset(req, res);
    case 'login-activity':
      return handleLoginActivity(req, res, decodedToken);
    case 'devices':
      return handleDevices(req, res, decodedToken);
    case 'profile-pin':
      return handleProfilePin(req, res, decodedToken);
    case 'create-profile':
      return handleCreateProfile(req, res, decodedToken);
    case 'subscribe':
    case 'subscription':
      return handleSubscription(req, res, decodedToken);
    case 'change-plan':
      return handleChangePlan(req, res, decodedToken);
    case 'cancel-subscription':
      return handleCancelSubscription(req, res, decodedToken);
    default:
      return res.status(HTTP_STATUS.BAD_REQUEST).json(apiError('INVALID_ACTION', 'Unknown auth action'));
  }
}

export default withAuth(authHandler);
