/**
 * TMDB API Client
 * Centralised TMDB API interactions with caching support
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Fetch from TMDB API with error handling
 */
export async function fetchTMDB(endpoint, queryParams = {}) {
  try {
    const params = new URLSearchParams({
      api_key: process.env.TMDB_API_KEY,
      ...queryParams,
    });

    const url = `${TMDB_BASE_URL}${endpoint}?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`TMDB fetch failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get image URL from TMDB CDN
 */
export function getTMDBImageUrl(path, size = 'w500') {
  if (!path) return '/placeholder-poster.jpg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// Popular endpoints
export const TMDB_ENDPOINTS = {
  TRENDING: (type = 'all', window = 'week') => `/trending/${type}/${window}`,
  POPULAR_MOVIES: '/movie/popular',
  TOP_RATED_MOVIES: '/movie/top_rated',
  UPCOMING_MOVIES: '/movie/upcoming',
  POPULAR_TV: '/tv/popular',
  TOP_RATED_TV: '/tv/top_rated',
  MOVIE_DETAILS: (id) => `/movie/${id}`,
  TV_DETAILS: (id) => `/tv/${id}`,
  MOVIE_CREDITS: (id) => `/movie/${id}/credits`,
  TV_CREDITS: (id) => `/tv/${id}/credits`,
  VIDEOS: (type, id) => `/${type}/${id}/videos`,
  SIMILAR: (type, id) => `/${type}/${id}/similar`,
  RECOMMENDATIONS: (type, id) => `/${type}/${id}/recommendations`,
  SEARCH_MULTI: '/search/multi',
  GENRES_MOVIES: '/genre/movie/list',
  GENRES_TV: '/genre/tv/list',
  DISCOVER_MOVIES: '/discover/movie',
  DISCOVER_TV: '/discover/tv',
};
