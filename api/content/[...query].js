/**
 * Consolidated Content Handler
 * Routes all content operations to a single serverless function
 * Handles: search, trending, and detail pages
 * 
 * Routes:
 *   - /api/content/search?query=...&page=...
 *   - /api/content/trending?type=...&window=...&page=...
 *   - /api/content/[id]?type=movie|tv
 */

import { fetchTMDB, TMDB_ENDPOINTS, getTMDBImageUrl } from '../../lib/tmdbClient.js';
import { apiSuccess, apiPaginated, apiError, HTTP_STATUS, sendResponse } from '../../lib/responseFormat.js';

// ============================================
// Search Handler
// ============================================

async function handleSearch(req, res) {
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

    const transformedResults = results.results
      .filter(item => item.media_type !== 'person')
      .map(item => ({
        ...item,
        poster_path: getTMDBImageUrl(item.poster_path),
        backdrop_path: getTMDBImageUrl(item.backdrop_path, 'w1280'),
      }));

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');

    return sendResponse(res, HTTP_STATUS.OK, apiPaginated(transformedResults, {
      page: results.page,
      total_pages: results.total_pages,
      total_results: results.total_results,
    }));
  } catch (error) {
    console.error('Search error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('SEARCH_FAILED', 'Failed to search content'));
  }
}

// ============================================
// Trending Handler
// ============================================

async function handleTrending(req, res) {
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
      pagination: {
        page: trending.page,
        total_pages: trending.total_pages,
      },
    }));
  } catch (error) {
    console.error('Trending error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('TRENDING_FAILED', 'Failed to fetch trending content'));
  }
}

// ============================================
// Detail Handler
// ============================================

async function handleDetail(req, res, id) {
  if (req.method !== 'GET') {
    return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('METHOD_NOT_ALLOWED', 'Only GET allowed'));
  }

  try {
    const { type = 'movie' } = req.query;

    if (!id) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('MISSING_ID', 'Missing content ID parameter'));
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
    console.error('Content detail error:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_ERROR, apiError('FETCH_FAILED', 'Failed to fetch content details'));
  }
}

// ============================================
// Main Router
// ============================================

export default async function handler(req, res) {
  // Extract path from URL: /api/content/[...query] -> could be 'search', 'trending', or numeric ID
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const contentType = pathSegments[pathSegments.length - 1];

  if (contentType === 'search') {
    return handleSearch(req, res);
  }

  if (contentType === 'trending') {
    return handleTrending(req, res);
  }

  // Otherwise treat as content ID (for detail pages)
  if (contentType && /^\d+$/.test(contentType)) {
    return handleDetail(req, res, contentType);
  }

  return sendResponse(res, HTTP_STATUS.BAD_REQUEST, apiError('INVALID_ROUTE', 'Invalid content route'));
}
