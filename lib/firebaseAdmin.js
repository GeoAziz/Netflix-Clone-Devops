import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This assumes the GOOGLE_APPLICATION_CREDENTIALS environment variable is set
// Or you can pass the service account directly

let firebase;

try {
  // Try to initialize with service account from environment
  firebase = admin.initializeApp();
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

export default firebase;
