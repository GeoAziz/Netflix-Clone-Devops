/**
 * /api/content/[id].js
 * GET single movie/show details with credits, videos, recommendations
 * 
 * Query params:
 *   - id: TMDB ID (required)
 *   - type: 'movie' | 'tv' (default: 'movie')
 */

import { fetchTMDB, TMDB_ENDPOINTS, getTMDBImageUrl } from '../../lib/tmdbClient.js';
import { apiSuccess, apiError, HTTP_STATUS, sendResponse } from '../../lib/responseFormat.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('METHOD_NOT_ALLOWED', 'Only GET allowed'));
  }

  try {
    const { id, type = 'movie' } = req.query;

    if (!id) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('MISSING_ID', 'Missing TMDB ID parameter'));
    }

    // Fetch all details in parallel
    const [details, credits, videos, similar, recommendations] = await Promise.all([
      fetchTMDB(TMDB_ENDPOINTS.MOVIE_DETAILS(id), { append_to_response: 'keywords,content_ratings' }),
      fetchTMDB(TMDB_ENDPOINTS.MOVIE_CREDITS(id), {}),
      fetchTMDB(TMDB_ENDPOINTS.VIDEOS(type, id), {}),
      fetchTMDB(TMDB_ENDPOINTS.SIMILAR(type, id), {}),
      fetchTMDB(TMDB_ENDPOINTS.RECOMMENDATIONS(type, id), {}),
    ]).catch(error => {
      throw new Error(`Failed to fetch details: ${error.message}`);
    });

    // Filter trailers - YouTube only
    const trailers = videos.results
      .filter(v => v.type === 'Trailer' && v.site === 'YouTube')
      .slice(0, 5)
      .map(v => ({
        ...v,
        url: `https://www.youtube.com/embed/${v.key}`,
      }));

    // Transform images
    const transformedDetails = {
      ...details,
      poster_path: getTMDBImageUrl(details.poster_path),
      backdrop_path: getTMDBImageUrl(details.backdrop_path, 'w1280'),
    };

    // Set cache headers - 1 hour cache
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

    return sendResponse(res, HTTP_STATUS.OK, apiSuccess({
      details: transformedDetails,
      credits: credits.cast?.slice(0, 20) || [],
      trailers,
      similar: similar.results?.map(item => ({
        ...item,
        poster_path: getTMDBImageUrl(item.poster_path),
      })) || [],
      recommendations: recommendations.results?.map(item => ({
        ...item,
        poster_path: getTMDBImageUrl(item.poster_path),
      })) || [],
    }));
  } catch (error) {
    console.error('Content detail endpoint error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('FETCH_FAILED', 'Failed to fetch content details'));
  }
}
