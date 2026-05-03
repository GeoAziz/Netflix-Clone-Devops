/**
 * /api/auth/password-reset.js - Forgot password and password reset flow
 * POST: Request password reset (sends email)
 * PUT: Reset password with token
 */

import { apiSuccess, apiError, HTTP_STATUS } from '../../lib/responseFormat.js';
import { db } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import crypto from 'crypto';

async function handler(req, res) {
  try {
    // POST: Request password reset
    if (req.method === 'POST') {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(apiError('INVALID_EMAIL', 'Valid email is required'));
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Check if user exists with this email
      const usersRef = db().collection('users').where('email', '==', email);
      const usersSnapshot = await usersRef.get();

      if (usersSnapshot.empty) {
        // For security, don't reveal if email exists
        // Just pretend we sent it
        return res.status(HTTP_STATUS.OK).json(
          apiSuccess({
            message: 'If an account exists with that email, a password reset link has been sent.',
          })
        );
      }

      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;

      // Store reset token with expiration (1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await db()
        .collection('passwordResetTokens')
        .doc(tokenHash)
        .set({
          userId,
          email,
          tokenHash,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          used: false,
        });

      // In production, send email with reset link
      const resetLink = `${process.env.VITE_APP_URL}/reset-password?token=${resetToken}`;
      console.log(`Password reset link: ${resetLink}`);

      // Log security event
      await db()
        .collection('auditLogs')
        .doc(userId)
        .collection('events')
        .add({
          type: 'PASSWORD_RESET_REQUESTED',
          email,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: req.headers['x-forwarded-for'] || 'unknown',
        });

      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          message: 'If an account exists with that email, a password reset link has been sent.',
        })
      );
    }

    // PUT: Reset password with token
    if (req.method === 'PUT') {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(apiError('MISSING_FIELDS', 'token and newPassword are required'));
      }

      if (newPassword.length < 6) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(apiError('WEAK_PASSWORD', 'Password must be at least 6 characters'));
      }

      // Hash and look up token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const tokenDoc = await db().collection('passwordResetTokens').doc(tokenHash).get();

      if (!tokenDoc.exists) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(apiError('INVALID_TOKEN', 'Password reset token is invalid or expired'));
      }

      const tokenData = tokenDoc.data();

      // Check if token is expired
      if (tokenData.expiresAt.toDate() < new Date()) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(apiError('EXPIRED_TOKEN', 'Password reset token has expired'));
      }

      // Check if token was already used
      if (tokenData.used) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(apiError('USED_TOKEN', 'This password reset link has already been used'));
      }

      const { userId } = tokenData;

      try {
        // Update password in Firebase Auth
        const userRecord = await admin.auth().getUser(userId);
        await admin.auth().updateUser(userId, {
          password: newPassword,
        });

        // Mark token as used
        await tokenDoc.ref.update({
          used: true,
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Log security event
        await db()
          .collection('auditLogs')
          .doc(userId)
          .collection('events')
          .add({
            type: 'PASSWORD_RESET_COMPLETE',
            email: userRecord.email,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: req.headers['x-forwarded-for'] || 'unknown',
        });

        return res.status(HTTP_STATUS.OK).json(
          apiSuccess({
            message: 'Password has been reset successfully. You can now log in with your new password.',
          })
        );
      } catch (authError) {
        console.error('Auth update error:', authError);
        return res
          .status(HTTP_STATUS.INTERNAL_ERROR)
          .json(apiError('SERVER_ERROR', 'Failed to reset password'));
      }
    }

    return res
      .status(HTTP_STATUS.METHOD_NOT_ALLOWED)
      .json(apiError('METHOD_NOT_ALLOWED', 'Method not allowed'));
  } catch (error) {
    console.error('Password reset error:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(apiError('SERVER_ERROR', 'Failed to process password reset'));
  }
}

export default handler;
