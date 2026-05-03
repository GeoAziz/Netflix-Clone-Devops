/**
 * /api/auth/profile-pin.js - Set and verify profile PIN for household privacy
 * GET: Check if profile has PIN
 * POST: Set/update PIN or verify PIN
 * DELETE: Remove PIN
 */

import { withAuth } from '../../lib/verifyToken.js';
import { apiSuccess, apiError, HTTP_STATUS } from '../../lib/responseFormat.js';
import { db } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import crypto from 'crypto';

// Hash PIN with salt (simple implementation)
function hashPin(pin, salt = null) {
  const pinSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(pin, pinSalt, 1000, 64, 'sha512')
    .toString('hex');
  return { hash, salt: pinSalt };
}

// Verify PIN against hash
function verifyPin(pin, hash, salt) {
  const { hash: newHash } = hashPin(pin, salt);
  return newHash === hash;
}

async function handler(req, res, decodedToken) {
  try {
    const { uid } = decodedToken;
    const { profileId } = req.query;

    if (!profileId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(apiError('MISSING_PROFILE_ID', 'Profile ID is required'));
    }

    // Verify user owns this profile
    const profileRef = db()
      .collection('userProfiles')
      .doc(uid)
      .collection('profiles')
      .doc(profileId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(apiError('PROFILE_NOT_FOUND', 'Profile not found'));
    }

    // GET: Check if profile has PIN
    if (req.method === 'GET') {
      const pinRef = db()
        .collection('profilePINs')
        .doc(uid)
        .collection('pins')
        .doc(profileId);
      const pinDoc = await pinRef.get();

      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          hasPIN: pinDoc.exists,
          pinSet: pinDoc.exists ? pinDoc.data().pinSet : false,
        })
      );
    }

    // POST: Set/verify PIN
    if (req.method === 'POST') {
      const { action, pin, currentPin } = req.body;

      if (!action || !pin) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(
            apiError('MISSING_FIELDS', 'action and pin are required')
          );
      }

      if (!/^\d{4}$/.test(pin)) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(
            apiError('INVALID_PIN', 'PIN must be exactly 4 digits')
          );
      }

      const pinRef = db()
        .collection('profilePINs')
        .doc(uid)
        .collection('pins')
        .doc(profileId);
      const pinDoc = await pinRef.get();

      // Set new PIN
      if (action === 'set') {
        // If PIN already exists, require current PIN
        if (pinDoc.exists && !verifyPin(currentPin, pinDoc.data().hash, pinDoc.data().salt)) {
          return res
            .status(HTTP_STATUS.UNAUTHORIZED)
            .json(apiError('INVALID_PIN', 'Current PIN is incorrect'));
        }

        const { hash, salt } = hashPin(pin);
        await pinRef.set({
          hash,
          salt,
          profileId,
          pinSet: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Log security event
        await db()
          .collection('auditLogs')
          .doc(uid)
          .collection('events')
          .add({
            type: 'PROFILE_PIN_SET',
            profileId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

        return res.status(HTTP_STATUS.OK).json(
          apiSuccess({
            message: 'Profile PIN set successfully',
          })
        );
      }

      // Verify PIN
      if (action === 'verify') {
        if (!pinDoc.exists) {
          return res
            .status(HTTP_STATUS.NOT_FOUND)
            .json(apiError('NO_PIN', 'This profile does not have a PIN'));
        }

        const isValid = verifyPin(pin, pinDoc.data().hash, pinDoc.data().salt);

        if (!isValid) {
          // Log failed attempt
          await db()
            .collection('auditLogs')
            .doc(uid)
            .collection('events')
            .add({
              type: 'PROFILE_PIN_FAILED_ATTEMPT',
              profileId,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

          return res
            .status(HTTP_STATUS.UNAUTHORIZED)
            .json(apiError('INVALID_PIN', 'PIN is incorrect'));
        }

        // Generate temporary session token for this profile
        const sessionToken = crypto.randomBytes(32).toString('hex');
        await db()
          .collection('profileSessions')
          .doc(uid)
          .collection('sessions')
          .doc(sessionToken)
          .set({
            profileId,
            sessionToken,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            ),
          });

        // Log successful verification
        await db()
          .collection('auditLogs')
          .doc(uid)
          .collection('events')
          .add({
            type: 'PROFILE_PIN_VERIFIED',
            profileId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

        return res.status(HTTP_STATUS.OK).json(
          apiSuccess({
            message: 'PIN verified',
            sessionToken,
          })
        );
      }

      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(apiError('INVALID_ACTION', 'Invalid PIN action'));
    }

    // DELETE: Remove PIN
    if (req.method === 'DELETE') {
      const pinRef = db()
        .collection('profilePINs')
        .doc(uid)
        .collection('pins')
        .doc(profileId);
      const pinDoc = await pinRef.get();

      if (!pinDoc.exists) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(apiError('NO_PIN', 'This profile does not have a PIN'));
      }

      await pinRef.delete();

      // Log security event
      await db()
        .collection('auditLogs')
        .doc(uid)
        .collection('events')
        .add({
          type: 'PROFILE_PIN_REMOVED',
          profileId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          message: 'Profile PIN removed',
        })
      );
    }

    return res
      .status(HTTP_STATUS.METHOD_NOT_ALLOWED)
      .json(apiError('METHOD_NOT_ALLOWED', 'Method not allowed'));
  } catch (error) {
    console.error('Profile PIN error:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(apiError('SERVER_ERROR', 'Failed to manage profile PIN'));
  }
}

export default withAuth((req, res, decodedToken) =>
  handler(req, res, decodedToken)
);
