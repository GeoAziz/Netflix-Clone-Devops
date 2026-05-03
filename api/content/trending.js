/**
 * /api/content/trending.js
 * GET trending movies and shows
 * 
 * Query params:
 *   - type: 'all' | 'movie' | 'tv' (default: 'all')
 *   - window: 'day' | 'week' (default: 'week')
 *   - page: number (default: 1)
 */

import { fetchTMDB, TMDB_ENDPOINTS, getTMDBImageUrl } from '../../lib/tmdbClient.js';
import { apiSuccess, apiPaginated, apiError, HTTP_STATUS, sendResponse } from '../../lib/responseFormat.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('METHOD_NOT_ALLOWED', 'Only GET allowed'));
  }

  try {
    const { type = 'all', window = 'week', page = 1 } = req.query;

    // Fetch trending concurrently
    const [trending, topMovies, topTV] = await Promise.all([
      fetchTMDB(TMDB_ENDPOINTS.TRENDING(type, window), { page }),
      fetchTMDB(TMDB_ENDPOINTS.TOP_RATED_MOVIES, { page: 1 }),
      fetchTMDB(TMDB_ENDPOINTS.TOP_RATED_TV, { page: 1 }),
    ]);

    // Transform results
    const transformedTrending = trending.results.map(item => ({
      ...item,
      poster_path: getTMDBImageUrl(item.poster_path),
      backdrop_path: getTMDBImageUrl(item.backdrop_path, 'w1280'),
    }));

    const transformedMovies = topMovies.results.slice(0, 10).map(item => ({
      ...item,
      poster_path: getTMDBImageUrl(item.poster_path),
    }));

    const transformedTV = topTV.results.slice(0, 10).map(item => ({
      ...item,
      poster_path: getTMDBImageUrl(item.poster_path),
    }));

    // Set cache headers - cache for 30 minutes
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');

    return sendResponse(res, HTTP_STATUS.OK, apiSuccess({
      trending: transformedTrending,
      topMovies: transformedMovies,
      topTV: transformedTV,
    }, {
      page: parseInt(page),
    }));
  } catch (error) {
    console.error('Trending endpoint error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('FETCH_FAILED', 'Failed to fetch trending content'));
  }
}
