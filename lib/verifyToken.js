/* global process */
/**
 * Firebase Admin Token Verification
 * Used in all protected API routes
 * Verifies Firebase ID tokens server-side
 */

import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin SDK once
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

/**
 * Verify Firebase ID token from Authorization header
 * @param {Object} req - Next.js API request object
 * @returns {Promise<Object>} - Decoded token with uid, email, etc.
 * @throws {Error} - If token is invalid or missing
 */
export async function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      throw new Error('Invalid authorization format');
    }

    const decoded = await getAuth().verifyIdToken(token);
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Middleware to verify token and return 401 if invalid
 */
export async function withAuth(req, res, handler) {
  try {
    const user = await verifyToken(req);
    return handler(req, res, user);
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message,
      },
    });
  }
}
