/**
 * /api/content/search.js
 * Search movies and shows
 * 
 * Query params:
 *   - query: search term (required)
 *   - page: number (default: 1)
 */

import { fetchTMDB, TMDB_ENDPOINTS, getTMDBImageUrl } from '../../lib/tmdbClient.js';
import { apiSuccess, apiPaginated, apiError, HTTP_STATUS, sendResponse } from '../../lib/responseFormat.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('METHOD_NOT_ALLOWED', 'Only GET allowed'));
  }

  try {
    const { query, page = 1 } = req.query;

    if (!query || query.trim().length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('MISSING_QUERY', 'Search query is required'));
    }

    const results = await fetchTMDB(TMDB_ENDPOINTS.SEARCH_MULTI, {
      query: query.trim(),
      page,
      include_adult: false,
    });

    // Filter and transform results
    const filtered = results.results
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => ({
        ...item,
        poster_path: getTMDBImageUrl(item.poster_path),
        backdrop_path: getTMDBImageUrl(item.backdrop_path, 'w1280'),
      }));

    // Set cache headers
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');

    return sendResponse(res, HTTP_STATUS.OK, apiPaginated(
      filtered,
      parseInt(page),
      results.total_pages,
      results.total_results
    ));
  } catch (error) {
    console.error('Search endpoint error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('SEARCH_FAILED', 'Search failed'));
  }
}
