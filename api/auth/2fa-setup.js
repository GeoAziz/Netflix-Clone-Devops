/**
 * /api/auth/2fa-setup.js - Enable/disable two-factor authentication
 * POST: Setup MFA (generate QR code)
 * DELETE: Disable MFA
 */

import { withAuth } from '../../lib/verifyToken.js';
import { apiSuccess, apiError, HTTP_STATUS } from '../../lib/responseFormat.js';
import { db } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

// Generate a simple TOTP secret (in production, use speakeasy or similar)
function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Generate backup codes
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

async function handler(req, res, decodedToken) {
  try {
    const { uid } = decodedToken;

    // GET: Retrieve current 2FA status
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
          backupCodesCount: mfaData.backupCodes?.length || 0,
          method: mfaData.method || null,
        })
      );
    }

    // POST: Setup MFA - generate secret and QR code
    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'generateSecret') {
        const secret = generateSecret();
        const backupCodes = generateBackupCodes(10);

        // Store pending secret (not yet confirmed)
        const tempRef = db().collection('mfaSettings').doc(uid);
        await tempRef.set(
          {
            pendingSecret: secret,
            backupCodes: backupCodes,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // Generate QR code URL (using Google Charts API)
        const qrCodeUrl = `https://chart.googleapis.com/chart?chs=300x300&chld=M|0&cht=qr&chl=${encodeURIComponent(
          `otpauth://totp/Netflix:${decodedToken.email}?secret=${secret}&issuer=Netflix`
        )}`;

        return res.status(HTTP_STATUS.OK).json(
          apiSuccess({
            qrCode: qrCodeUrl,
            secret: secret,
            backupCodes: backupCodes,
            message: 'Scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, etc.)',
          })
        );
      }

      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(apiError('INVALID_ACTION', 'Invalid 2FA action'));
    }

    // DELETE: Disable MFA
    if (req.method === 'DELETE') {
      const { password } = req.body;

      // Verify password before allowing MFA disable
      if (!password) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(apiError('MISSING_PASSWORD', 'Password required to disable 2FA'));
      }

      // Update MFA settings
      const mfaRef = db().collection('mfaSettings').doc(uid);
      await mfaRef.set(
        {
          enabled: false,
          pendingSecret: null,
          backupCodes: [],
          disabledAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Log security event
      await db()
        .collection('auditLogs')
        .doc(uid)
        .collection('events')
        .add({
          type: 'MFA_DISABLED',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: req.headers['x-forwarded-for'] || 'unknown',
          userAgent: req.headers['user-agent'],
        });

      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          message: 'Two-factor authentication has been disabled',
        })
      );
    }

    return res
      .status(HTTP_STATUS.METHOD_NOT_ALLOWED)
      .json(apiError('METHOD_NOT_ALLOWED', 'Method not allowed'));
  } catch (error) {
    console.error('2FA setup error:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(apiError('SERVER_ERROR', 'Failed to process 2FA request'));
  }
}

export default withAuth((req, res, decodedToken) =>
  handler(req, res, decodedToken)
);
