/**
 * /api/user/myList.js
 * POST: Add title to My List
 * DELETE: Remove from My List
 * GET: Get My List items
 */

import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { app } from '../../firebase.jsx';
import { withAuth } from '../../lib/verifyToken.js';
import { validateRequest, MyListEntrySchema } from '../../lib/validation.js';
import { apiSuccess, apiError, HTTP_STATUS, sendResponse } from '../../lib/responseFormat.js';

const db = getFirestore(app);

async function POST(req, res, user) {
  try {
    const validation = validateRequest(MyListEntrySchema, req.body);
    if (!validation.valid) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('VALIDATION_ERROR', 'Invalid request body'));
    }

    const { profileId, tmdbId, mediaType, title, posterPath } = validation.data;

    const listRef = doc(
      db,
      `myList/${user.uid}/${profileId}/${tmdbId}`
    );

    await setDoc(listRef, {
      tmdbId,
      mediaType,
      title,
      posterPath,
      addedAt: serverTimestamp(),
    });

    return sendResponse(res, HTTP_STATUS.OK, apiSuccess({ added: true }));
  } catch (error) {
    console.error('My List POST error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('ADD_FAILED', 'Failed to add to list'));
  }
}

async function DELETE(req, res, user) {
  try {
    const { profileId, tmdbId } = req.query;

    if (!profileId || !tmdbId) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('MISSING_PARAMS', 'Missing profileId or tmdbId'));
    }

    const listRef = doc(db, `myList/${user.uid}/${profileId}/${tmdbId}`);
    await deleteDoc(listRef);

    return sendResponse(res, HTTP_STATUS.OK, apiSuccess({ removed: true }));
  } catch (error) {
    console.error('My List DELETE error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('REMOVE_FAILED', 'Failed to remove from list'));
  }
}

async function GET(req, res, user) {
  try {
    const { profileId } = req.query;

    if (!profileId) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('MISSING_PROFILE', 'Missing profileId'));
    }

    const listRef = collection(db, `myList/${user.uid}/${profileId}`);
    const snapshot = await getDocs(listRef);

    const myList = [];
    snapshot.forEach(doc => {
      myList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return sendResponse(res, HTTP_STATUS.OK, apiSuccess(myList));
  } catch (error) {
    console.error('My List GET error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('FETCH_FAILED', 'Failed to fetch my list'));
  }
}

export default async function handler(req, res) {
  return withAuth(req, res, async (req, res, user) => {
    if (req.method === 'POST') {
      return POST(req, res, user);
    } else if (req.method === 'DELETE') {
      return DELETE(req, res, user);
    } else if (req.method === 'GET') {
      return GET(req, res, user);
    } else {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('METHOD_NOT_ALLOWED', 'Only GET, POST, DELETE allowed'));
    }
  });
}
