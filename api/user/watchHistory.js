/**
 * /api/user/watchHistory.js
 * POST: Update watch progress for a title
 * GET: Get watch history for current profile
 */

import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { app } from '../../firebase.jsx';
import { withAuth } from '../../lib/verifyToken.js';
import { validateRequest, WatchHistorySchema } from '../../lib/validation.js';
import { apiSuccess, apiError, HTTP_STATUS, sendResponse } from '../../lib/responseFormat.js';

const db = getFirestore(app);

async function POST(req, res, user) {
  try {
    const validation = validateRequest(WatchHistorySchema, req.body);
    if (!validation.valid) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('VALIDATION_ERROR', 'Invalid request body'));
    }

    const { profileId, tmdbId, mediaType, progressSeconds, durationSeconds, season, episode } = validation.data;

    const progressPercent = Math.round((progressSeconds / durationSeconds) * 100);
    const completed = progressPercent >= 90;

    const watchRef = doc(
      db,
      `watchHistory/${user.uid}/${profileId}/${tmdbId}`
    );

    await setDoc(watchRef, {
      tmdbId,
      mediaType,
      progressSeconds,
      durationSeconds,
      progressPercent,
      completed,
      season,
      episode,
      lastWatched: serverTimestamp(),
    }, { merge: true });

    return sendResponse(res, HTTP_STATUS.OK, apiSuccess({ saved: true }));
  } catch (error) {
    console.error('Watch history POST error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('SAVE_FAILED', 'Failed to save watch progress'));
  }
}

async function GET(req, res, user) {
  try {
    const { profileId } = req.query;

    if (!profileId) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('MISSING_PROFILE', 'Missing profileId'));
    }

    const historyRef = collection(db, `watchHistory/${user.uid}/${profileId}`);
    const snapshot = await getDocs(historyRef);

    const watchHistory = [];
    snapshot.forEach(doc => {
      watchHistory.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by last watched (newest first)
    watchHistory.sort((a, b) => b.lastWatched?.seconds - a.lastWatched?.seconds);

    return sendResponse(res, HTTP_STATUS.OK, apiSuccess(watchHistory));
  } catch (error) {
    console.error('Watch history GET error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('FETCH_FAILED', 'Failed to fetch watch history'));
  }
}

export default async function handler(req, res) {
  return withAuth(req, res, async (req, res, user) => {
    if (req.method === 'POST') {
      return POST(req, res, user);
    } else if (req.method === 'GET') {
      return GET(req, res, user);
    } else {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('METHOD_NOT_ALLOWED', 'Only GET and POST allowed'));
    }
  });
}
