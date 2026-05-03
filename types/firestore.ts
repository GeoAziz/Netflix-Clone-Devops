/**
 * Firestore Database Type Definitions
 * TypeScript interfaces for all Firestore collections
 */

/**
 * User Profile document
 */
export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  isKids: boolean;
  language: string; // ISO 639-1 code: 'en', 'fr', etc.
  maturityRating: 'G' | 'PG' | 'PG-13' | 'R';
  autoplayEnabled: boolean;
  previewsEnabled: boolean;
  pinHash: string | null; // bcrypt hash of PIN
}

/**
 * Watch history entry per title
 */
export interface WatchEntry {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  progressSeconds: number;
  durationSeconds: number;
  progressPercent: number; // 0-100
  completed: boolean;
  lastWatched: any; // Firestore Timestamp
  season?: number; // TV only
  episode?: number; // TV only
}

/**
 * My List entry
 */
export interface MyListEntry {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string; // Denormalized for display
  posterPath: string; // Denormalized for display
  addedAt: any; // Firestore Timestamp
}

/**
 * User rating/reaction
 */
export interface Rating {
  tmdbId: number;
  rating: 'like' | 'love' | 'dislike';
  ratedAt: any; // Firestore Timestamp
}

/**
 * Search history entry
 */
export interface SearchEntry {
  query: string;
  timestamp: any; // Firestore Timestamp
}

/**
 * Notification
 */
export interface Notification {
  type: 'new_episode' | 'reminder' | 'recommendation';
  title: string;
  body: string;
  tmdbId: number | null;
  read: boolean;
  createdAt: any; // Firestore Timestamp
}

/**
 * TMDB Movie/Show object (from API)
 */
export interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
}

/**
 * API Recommendation object
 */
export interface RecommendationRow {
  title: string;
  description: string;
  items: (TMDBItem & { reason?: string })[];
  reason?: string;
}

/**
 * Recommendation engine taste profile
 */
export interface TasteProfile {
  genreWeights: Record<number, number>;
  actorWeights: Record<number, number>;
  directorWeights: Record<number, number>;
}
