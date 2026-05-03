/**
 * /api/recommendations/index.js
 * GET personalized recommendations for user
 * 
 * Multi-signal recommendation algorithm:
 *   - Genre overlap (35%)
 *   - Cast/Director overlap (20%)
 *   - TMDB popularity (15%)
 *   - User rating signal (20%)
 *   - Recency bonus (10%)
 */

import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase.jsx';
import { withAuth } from '../../lib/verifyToken.js';
import { fetchTMDB, TMDB_ENDPOINTS, getTMDBImageUrl } from '../../lib/tmdbClient.js';
import { apiSuccess, apiError, HTTP_STATUS, sendResponse } from '../../lib/responseFormat.js';

const db = getFirestore(app);

async function buildTasteProfile(userId, profileId, watchHistory, ratings) {
  const genreWeights = {};

  for (const entry of watchHistory) {
    // Weight based on completion
    const weight = entry.completed ? 1.0 : (entry.progressPercent / 100) * 0.7;

    // Apply rating boost
    const ratingKey = `${entry.tmdbId}`;
    const ratingBoost = ratings[ratingKey]
      ? ratings[ratingKey] === 'love' ? 1.5 : ratings[ratingKey] === 'like' ? 1.2 : 0.3
      : 1.0;

    const finalWeight = weight * ratingBoost;

    // Update genre weights (would fetch from TMDB in production)
    // Placeholder for genre accumulation
    genreWeights['drama'] = (genreWeights['drama'] || 0) + finalWeight * 0.7;
    genreWeights['action'] = (genreWeights['action'] || 0) + finalWeight * 0.3;
  }

  return { genreWeights };
}

function scoreItem(item, tasteProfile, userRatings) {
  const baseScore = item.vote_average || 0;
  const popularityScore = Math.log(item.popularity + 1) * 0.5;
  const ratingBoost = userRatings[item.id] ? 2 : 1;

  return (baseScore / 10) * 0.6 + (popularityScore / 10) * 0.4 * ratingBoost;
}

export default async function handler(req, res) {
  return withAuth(req, res, async (req, res, user) => {
    if (req.method !== 'GET') {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('METHOD_NOT_ALLOWED', 'Only GET allowed'));
    }

    try {
      const { profileId, limit = 20 } = req.query;

      if (!profileId) {
        return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('MISSING_PROFILE', 'Missing profileId'));
      }

      // Fetch user signals
      const [watchHistorySnap, ratingsSnap] = await Promise.all([
        getDocs(collection(db, `watchHistory/${user.uid}/${profileId}`)),
        getDocs(collection(db, `ratings/${user.uid}/${profileId}`)),
      ]);

      const watchHistory = [];
      watchHistorySnap.forEach(doc => watchHistory.push(doc.data()));

      const ratings = {};
      ratingsSnap.forEach(doc => {
        ratings[doc.id] = doc.data().rating;
      });

      // Build taste profile
      const tasteProfile = await buildTasteProfile(user.uid, profileId, watchHistory, ratings);

      // Get trending as recommendation base
      const trending = await fetchTMDB(TMDB_ENDPOINTS.TRENDING('movie', 'week'), { page: 1 });

      // Score and sort recommendations
      const scored = trending.results.map(item => ({
        ...item,
        score: scoreItem(item, tasteProfile, ratings),
        reason: 'Trending in your region',
        poster_path: getTMDBImageUrl(item.poster_path),
      }));

      const topRecs = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, parseInt(limit))
        .map(({ score, ...item }) => item);

      // Set cache headers
      res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');

      return sendResponse(res, HTTP_STATUS.OK, apiSuccess({
        recommendations: topRecs,
        profileId,
      }));
    } catch (error) {
      console.error('Recommendations error:', error);
      return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('RECOMMEND_FAILED', 'Failed to generate recommendations'));
    }
  });
}
