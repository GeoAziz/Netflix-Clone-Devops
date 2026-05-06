/**
 * Firestore Query Optimization Utilities
 * Patterns to stay within Spark Plan limits
 * 
 * Free Tier Limits:
 * - 50,000 reads/day
 * - 20,000 writes/day
 * - 1GB storage
 * - 10GB egress/day
 */

import {
  getDoc,
  doc,
  writeBatch,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * ❌ ANTI-PATTERN: One read per list item
 * This kills quota quickly!
 */
export async function BAD_fetchMyListItems(db, userId, profileId, myListIds) {
  // This is WRONG - one read per ID = 100 reads for 100 items
  return Promise.all(
    myListIds.map(id =>
      getDoc(doc(db, 'myList', userId, profileId, id))
    )
  );
}

/**
 * ✅ GOOD PATTERN: Single document read with array
 * Store TMDB IDs in user doc, fetch details from TMDB
 */
export async function GOOD_getMyListIds(db, userId, profileId) {
  // One read = get entire My List
  const userRef = doc(db, `myList/${userId}/${profileId}`);
  const snap = await getDoc(userRef);
  
  // IDs stored as array: [123, 456, 789]
  // Now fetch from TMDB (public API, free)
  return snap.data().itemIds;
}

/**
 * ✅ GOOD PATTERN: Batch writes
 * Don't write individual progress updates every second
 */
export async function batchUpdateWatchProgress(db, userId, profileId, progressUpdates) {
  const batch = writeBatch(db);
  
  for (const { tmdbId, progress } of progressUpdates) {
    const ref = doc(db, `watchHistory/${userId}/${profileId}/${tmdbId}`);
    batch.set(ref, progress, { merge: true });
  }
  
  await batch.commit(); // One write per item, not per update
}

/**
 * ✅ GOOD PATTERN: Debounce writes
 * Client debounces video progress to every 10 seconds max
 */
export function createProgressDebouncer(onSave, delay = 10000) {
  let timeout;
  
  return (progressData) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => onSave(progressData), delay);
  };
}

/**
 * ✅ GOOD PATTERN: Use onSnapshot (real-time listener) for active reads
 * Unsubscribe when component unmounts
 */
export async function listenToUserSettings(db, userId, onUpdate) {
  const userRef = doc(db, 'users', userId);
  
  const unsubscribe = onSnapshot(userRef, (snap) => {
    onUpdate(snap.data());
  });
  
  // Return cleanup function for useEffect
  return () => unsubscribe();
}

/**
 * ✅ GOOD PATTERN: Lazy load secondary collections
 * Don't read watch history on page load
 * Only read when user navigates to "Resume Watching"
 */
export async function lazyLoadWatchHistory(db, userId, profileId, onReady) {
  const historyRef = collection(db, `watchHistory/${userId}/${profileId}`);
  const q = query(
    historyRef,
    where('completed', '==', false),
    orderBy('lastWatched', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(doc => doc.data());
    onUpdate(items);
  });
}

/**
 * ✅ GOOD PATTERN: Store only metadata in Firestore
 * Never store full content from TMDB - just IDs & user reactions
 */
export async function saveToMyList(db, userId, profileId, tmdbItem) {
  // Don't store entire TMDB response
  // ❌ BAD: 20KB per item × 1000 items = 20MB quota hit
  
  // ✅ GOOD: Store only what you need
  await setDoc(doc(db, `myList/${userId}/${profileId}/${tmdbItem.id}`), {
    tmdbId: tmdbItem.id,
    mediaType: tmdbItem.media_type,
    title: tmdbItem.title, // Denormalized for display only
    posterPath: tmdbItem.poster_path,
    addedAt: serverTimestamp(),
  });
}

/**
 * Free Tier Budget Tracker
 */
export const FREE_TIER_LIMITS = {
  FIRESTORE_READS_PER_DAY: 50000,
  FIRESTORE_WRITES_PER_DAY: 20000,
  FIRESTORE_STORAGE_GB: 1,
  STORAGE_EGRESS_GB: 10,
  
  // Recommendation for Netflix Clone
  RECOMMENDED_STRATEGY: {
    cacheTMDBResponses: true,
    debounceProgress: 10000, // 10 seconds
    batchWrites: true,
    lazyLoadCollections: true,
    denormalizeFrequentReads: true,
  },
};
