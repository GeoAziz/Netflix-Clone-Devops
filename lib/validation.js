/**
 * Input Validation Schemas
 * Type-safe request validation using Zod
 * Ensures all API contracts are enforced
 */

import { z } from 'zod';

// Watch History validation
export const WatchHistorySchema = z.object({
  profileId: z.string().uuid('Invalid profile ID'),
  tmdbId: z.number().positive('TMDB ID must be positive'),
  mediaType: z.enum(['movie', 'tv']),
  progressSeconds: z.number().min(0),
  durationSeconds: z.number().positive(),
  season: z.number().optional(),
  episode: z.number().optional(),
});

// My List entry validation
export const MyListEntrySchema = z.object({
  profileId: z.string().uuid(),
  tmdbId: z.number().positive(),
  mediaType: z.enum(['movie', 'tv']),
  title: z.string().min(1),
  posterPath: z.string().nullable(),
});

// Rating validation
export const RatingSchema = z.object({
  profileId: z.string().uuid(),
  tmdbId: z.number().positive(),
  rating: z.enum(['like', 'love', 'dislike']),
});

// Profile creation validation
export const ProfileSchema = z.object({
  name: z.string().min(1).max(30),
  avatarUrl: z.string().url().optional(),
  isKids: z.boolean().default(false),
  language: z.string().length(2).default('en'), // ISO 639-1
  maturityRating: z.enum(['G', 'PG', 'PG-13', 'R']).default('PG-13'),
  autoplayEnabled: z.boolean().default(true),
  previewsEnabled: z.boolean().default(true),
  pin: z.string().optional(),
});

// Pagination validation
export const PaginationSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(50).default(20),
});

/**
 * Safe parse wrapper with error formatting
 */
export function validateRequest(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.flatten().fieldErrors,
    };
  }
  return {
    valid: true,
    data: result.data,
  };
}
