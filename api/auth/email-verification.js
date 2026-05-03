/**
 * /api/auth/email-verification.js - Email verification for new accounts
 * POST: Send verification email
 * PUT: Verify email with token
 */

import { apiSuccess, apiError, HTTP_STATUS } from '../../lib/responseFormat.js';
import { db } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import crypto from 'crypto';

async function handler(req, res) {
  try {
    // POST: Send verification email
    if (req.method === 'POST') {
      const { email, userId } = req.body;

      if (!email || !userId) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(apiError('MISSING_FIELDS', 'email and userId are required'));
      }

      // Check if already verified
      const userRef = db().collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists && userDoc.data().emailVerified) {
        return res.status(HTTP_STATUS.OK).json(
          apiSuccess({
            message: 'Email is already verified',
          })
        );
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

      // Store token with expiration (24 hours)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      await db()
        .collection('emailVerificationTokens')
        .doc(tokenHash)
        .set({
          userId,
          email,
          tokenHash,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          verified: false,
        });

      // In production, send email with verification link
      const verificationLink = `${process.env.VITE_APP_URL}/verify-email?token=${verificationToken}`;
      console.log(`Email verification link: ${verificationLink}`);

      // Log security event
      await db()
        .collection('auditLogs')
        .doc(userId)
        .collection('events')
        .add({
          type: 'EMAIL_VERIFICATION_SENT',
          email,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          message: 'Verification email has been sent. Please check your inbox.',
          verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined,
        })
      );
    }

    // PUT: Verify email with token
    if (req.method === 'PUT') {
      const { token } = req.body;

      if (!token) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(apiError('MISSING_TOKEN', 'Verification token is required'));
      }

      // Hash and look up token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const tokenDoc = await db()
        .collection('emailVerificationTokens')
        .doc(tokenHash)
        .get();

      if (!tokenDoc.exists) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(apiError('INVALID_TOKEN', 'Email verification token is invalid'));
      }

      const tokenData = tokenDoc.data();

      // Check if token is expired
      if (tokenData.expiresAt.toDate() < new Date()) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(apiError('EXPIRED_TOKEN', 'Email verification token has expired'));
      }

      // Check if already verified
      if (tokenData.verified) {
        return res.status(HTTP_STATUS.OK).json(
          apiSuccess({
            message: 'Email has already been verified',
          })
        );
      }

      const { userId } = tokenData;

      try {
        // Mark email as verified in Firebase Auth
        await admin.auth().updateUser(userId, {
          emailVerified: true,
        });

        // Update user document in Firestore
        await db().collection('users').doc(userId).update({
          emailVerified: true,
          emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Mark token as verified
        await tokenDoc.ref.update({
          verified: true,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Log security event
        await db()
          .collection('auditLogs')
          .doc(userId)
          .collection('events')
          .add({
            type: 'EMAIL_VERIFIED',
            email: tokenData.email,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

        return res.status(HTTP_STATUS.OK).json(
          apiSuccess({
            message: 'Email has been verified successfully!',
          })
        );
      } catch (authError) {
        console.error('Auth update error:', authError);
        return res
          .status(HTTP_STATUS.INTERNAL_ERROR)
          .json(apiError('SERVER_ERROR', 'Failed to verify email'));
      }
    }

    return res
      .status(HTTP_STATUS.METHOD_NOT_ALLOWED)
      .json(apiError('METHOD_NOT_ALLOWED', 'Method not allowed'));
  } catch (error) {
    console.error('Email verification error:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(apiError('SERVER_ERROR', 'Failed to process email verification'));
  }
}

export default handler;
