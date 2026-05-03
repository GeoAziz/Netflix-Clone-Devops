/**
 * /api/tmdb/[...path].js
 * TMDB API proxy - protects API key from client exposure
 * All TMDB calls routed through this function
 */

import { fetchTMDB } from '../../lib/tmdbClient.js';
import { apiSuccess, apiError, HTTP_STATUS, sendResponse } from '../../lib/responseFormat.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('METHOD_NOT_ALLOWED', 'Only GET allowed'));
  }

  try {
    const { path = [] } = req.query;
    const endpoint = `/${Array.isArray(path) ? path.join('/') : path}`;

    if (!endpoint || endpoint === '/') {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('MISSING_ENDPOINT', 'Missing TMDB endpoint'));
    }

    // Pass through query parameters (except path)
    const queryParams = { ...req.query };
    delete queryParams.path;

    const data = await fetchTMDB(endpoint, queryParams);

    // Set cache headers - 1 hour cache
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

    return sendResponse(res, HTTP_STATUS.OK, apiSuccess(data));
  } catch (error) {
    console.error('TMDB proxy error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('PROXY_ERROR', 'TMDB proxy request failed'));
  }
}
