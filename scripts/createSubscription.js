/* global process */
/**
 * Manual Subscription Creation Script
 * Creates the subscription document in Firestore for the registered user
 * This is needed because the REST API subscription creation had issues
 */

const FIREBASE_CONFIG = {
  projectId: 'netflix-clone-devops-8614a',
  apiKey: 'AIzaSyBfR9L1AcOoEV_lDT7rbcYFIJW5zrDA5lU',
};

const USER_ID = '4q72bzE01kSWoMDzVd4H0649tFo1';
const EMAIL = 'crookx089@gmail.com';
const PLAN_ID = 'standard';

async function createSubscription() {
  try {
    console.log('📋 Creating subscription document in Firestore...\n');

    const now = new Date();
    const renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscriptionData = {
      fields: {
        userId: { stringValue: USER_ID },
        planId: { stringValue: PLAN_ID },
        planName: { stringValue: 'Standard' },
        price: { doubleValue: 15.49 },
        currency: { stringValue: 'USD' },
        billingPeriod: { stringValue: 'month' },
        status: { stringValue: 'active' },
        trialEndsAt: { nullValue: true },
        startDate: { timestampValue: now.toISOString() },
        renewalDate: { timestampValue: renewalDate.toISOString() },
        createdAt: { timestampValue: now.toISOString() },
        updatedAt: { timestampValue: now.toISOString() },
      },
    };

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/subscriptions/${USER_ID}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Subscription created successfully!\n');
      console.log('📊 Subscription Details:');
      console.log(`   User ID: ${USER_ID}`);
      console.log(`   Plan: Standard`);
      console.log(`   Price: $15.49/month`);
      console.log(`   Status: Active`);
      console.log(`   Start Date: ${now.toDateString()}`);
      console.log(`   Renewal Date: ${renewalDate.toDateString()}\n`);
    } else {
      const error = await response.json();
      console.warn('⚠️  API Response:', response.status);
      console.log('Note: This might be expected if Firestore rules require authentication.\n');
      console.log('📝 Manual Steps to create subscription in Firebase Console:\n');
      console.log('1. Go to Firebase Console → Firestore Database');
      console.log('2. Click "Create Collection" → Enter "subscriptions"');
      console.log('3. Click "Add Document" → Use ID: ' + USER_ID);
      console.log('4. Add these fields:');
      console.log(`   - userId (string): "${USER_ID}"`);
      console.log(`   - planId (string): "standard"`);
      console.log(`   - planName (string): "Standard"`);
      console.log(`   - price (number): 15.49`);
      console.log(`   - currency (string): "USD"`);
      console.log(`   - billingPeriod (string): "month"`);
      console.log(`   - status (string): "active"`);
      console.log(`   - startDate (timestamp): ${now.toISOString()}`);
      console.log(`   - renewalDate (timestamp): ${renewalDate.toISOString()}`);
      console.log(`   - createdAt (timestamp): ${now.toISOString()}`);
      console.log(`   - updatedAt (timestamp): ${now.toISOString()}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSubscription().then(() => {
  console.log('✨ Done!\n');
  process.exit(0);
});
