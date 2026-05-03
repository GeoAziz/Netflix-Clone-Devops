/**
 * /api/auth/devices.js - Manage trusted devices and session tracking
 * GET: List all trusted devices
 * POST: Add current device as trusted
 * DELETE: Sign out from specific device
 */

import { withAuth } from '../../lib/verifyToken.js';
import { apiSuccess, apiError, HTTP_STATUS } from '../../lib/responseFormat.js';
import { db } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import crypto from 'crypto';

// Generate device fingerprint (hash of user agent + IP)
function generateDeviceFingerprint(userAgent, ipAddress) {
  const hash = crypto
    .createHash('sha256')
    .update(`${userAgent}${ipAddress}`)
    .digest('hex');
  return hash.substring(0, 16);
}

// Parse user agent to extract device info
function parseUserAgent(userAgent) {
  const isChrome = /Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent);
  const isEdge = /Edge/.test(userAgent);
  const isMobile = /Mobile|Android|iPhone/.test(userAgent);

  let browser = 'Unknown';
  if (isChrome) browser = 'Chrome';
  if (isFirefox) browser = 'Firefox';
  if (isSafari && !isChrome) browser = 'Safari';
  if (isEdge) browser = 'Edge';

  return {
    browser,
    isMobile,
    userAgent: userAgent.substring(0, 100), // Truncate for storage
  };
}

async function handler(req, res, decodedToken) {
  try {
    const { uid } = decodedToken;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // GET: List all trusted devices
    if (req.method === 'GET') {
      const devicesRef = db().collection('devices').doc(uid).collection('list');
      const devicesSnapshot = await devicesRef.orderBy('lastActive', 'desc').get();

      const devices = devicesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        lastActive: doc.data().lastActive?.toDate?.() || null,
        createdAt: doc.data().createdAt?.toDate?.() || null,
      }));

      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          devices,
          total: devices.length,
        })
      );
    }

    // POST: Add current device as trusted
    if (req.method === 'POST') {
      const { deviceName, trustDuration } = req.body;
      const fingerprint = generateDeviceFingerprint(userAgent, ipAddress);
      const deviceInfo = parseUserAgent(userAgent);

      // Check if device already exists
      const existingDevice = await db()
        .collection('devices')
        .doc(uid)
        .collection('list')
        .doc(fingerprint)
        .get();

      if (existingDevice.exists) {
        // Update last active
        await existingDevice.ref.update({
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.status(HTTP_STATUS.OK).json(
          apiSuccess({
            message: 'Device trust updated',
            trusted: true,
          })
        );
      }

      // Add new device
      const trustExpiresAt = new Date();
      trustExpiresAt.setDate(trustExpiresAt.getDate() + (trustDuration || 30)); // Default 30 days

      await db()
        .collection('devices')
        .doc(uid)
        .collection('list')
        .doc(fingerprint)
        .set({
          name: deviceName || `${deviceInfo.browser} on ${deviceInfo.isMobile ? 'Mobile' : 'Desktop'}`,
          fingerprint,
          ipAddress,
          ...deviceInfo,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
          trustExpiresAt: admin.firestore.Timestamp.fromDate(trustExpiresAt),
        });

      // Log security event
      await db()
        .collection('auditLogs')
        .doc(uid)
        .collection('events')
        .add({
          type: 'DEVICE_TRUSTED',
          deviceName: deviceName,
          fingerprint,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress,
        });

      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          message: 'Device trusted successfully',
          deviceId: fingerprint,
        })
      );
    }

    // DELETE: Sign out from specific device
    if (req.method === 'DELETE') {
      const { deviceId } = req.body;

      if (!deviceId) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(apiError('MISSING_DEVICE_ID', 'Device ID required'));
      }

      // Get device info before deletion
      const deviceRef = db().collection('devices').doc(uid).collection('list').doc(deviceId);
      const deviceDoc = await deviceRef.get();

      if (!deviceDoc.exists) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(apiError('DEVICE_NOT_FOUND', 'Device not found'));
      }

      // Delete device
      await deviceRef.delete();

      // Log security event
      await db()
        .collection('auditLogs')
        .doc(uid)
        .collection('events')
        .add({
          type: 'DEVICE_REVOKED',
          deviceName: deviceDoc.data().name,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      return res.status(HTTP_STATUS.OK).json(
        apiSuccess({
          message: 'Device signed out successfully',
        })
      );
    }

    return res
      .status(HTTP_STATUS.METHOD_NOT_ALLOWED)
      .json(apiError('METHOD_NOT_ALLOWED', 'Method not allowed'));
  } catch (error) {
    console.error('Device management error:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(apiError('SERVER_ERROR', 'Failed to manage devices'));
  }
}

export default withAuth((req, res, decodedToken) =>
  handler(req, res, decodedToken)
);
