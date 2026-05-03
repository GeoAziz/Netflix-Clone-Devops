/**
 * React Query Setup
 * Data fetching and caching for API responses
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys for consistency
export const QUERY_KEYS = {
  TRENDING: ['trending'],
  CONTENT: (id, type) => ['content', type, id],
  SEARCH: (query) => ['search', query],
  WATCH_HISTORY: (profileId) => ['watchHistory', profileId],
  MY_LIST: (profileId) => ['myList', profileId],
  RECOMMENDATIONS: (profileId) => ['recommendations', profileId],
  RATINGS: (profileId) => ['ratings', profileId],
};

// API Fetch Functions
async function fetchTrending(type = 'all', window = 'week', page = 1) {
  const res = await fetch(`/api/content/trending?type=${type}&window=${window}&page=${page}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('idToken')}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch trending');
  return res.json();
}

async function fetchContentDetail(id, type = 'movie') {
  const res = await fetch(`/api/content/${id}?type=${type}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('idToken')}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch content');
  return res.json();
}

async function fetchSearch(query, page = 1) {
  const res = await fetch(`/api/content/search?query=${encodeURIComponent(query)}&page=${page}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('idToken')}`,
    },
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

// React Query Hooks
export function useTrending(type = 'all', window = 'week') {
  return useQuery({
    queryKey: QUERY_KEYS.TRENDING,
    queryFn: () => fetchTrending(type, window),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: 2,
  });
}

export function useContentDetail(id, type = 'movie') {
  return useQuery({
    queryKey: QUERY_KEYS.CONTENT(id, type),
    queryFn: () => fetchContentDetail(id, type),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useSearch(query, page = 1) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.SEARCH(query),
    queryFn: ({ pageParam = 1 }) => fetchSearch(query, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.meta?.page < lastPage.meta?.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: !!query && query.length > 2,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutations
export function useSaveWatchProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/user/watchHistory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('idToken')}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save progress');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.WATCH_HISTORY(variables.profileId),
      });
    },
  });
}

export function useAddToMyList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/user/myList', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('idToken')}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add to list');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MY_LIST(variables.profileId),
      });
    },
  });
}
