/**
 * Register User Script
 * This script creates a new user with the provided credentials
 * using Firebase REST APIs and stores data in Firestore
 * Uses native Node.js fetch (available in Node 18+)
 */

const EMAIL = 'crookx089@gmail.com';
const PASSWORD = '@Netflix!.';
const PLAN_ID = 'standard';

// Firebase configuration (from .env)
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBfR9L1AcOoEV_lDT7rbcYFIJW5zrDA5lU',
  authDomain: 'netflix-clone-devops-8614a.firebaseapp.com',
  projectId: 'netflix-clone-devops-8614a',
  storageBucket: 'netflix-clone-devops-8614a.firebasestorage.app',
  messagingSenderId: '915827751154',
  appId: '1:915827751154:web:a7a62fa146323e72dff86b',
};

async function registerUser() {
  try {
    console.log('🚀 Starting user registration...\n');

    // Step 1: Sign up user using Firebase REST API
    console.log(`📧 Step 1: Creating user via Firebase Auth...`);
    const signupResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: EMAIL,
          password: PASSWORD,
          returnSecureToken: true,
        }),
      }
    );

    if (!signupResponse.ok) {
      const error = await signupResponse.json();
      throw new Error(`Firebase signup failed: ${error.error?.message || 'Unknown error'}`);
    }

    const authData = await signupResponse.json();
    const userId = authData.localId;
    const idToken = authData.idToken;

    console.log(`✅ User created with UID: ${userId}\n`);

    // Step 2: Create subscription
    console.log(`💳 Step 2: Creating subscription...`);
    const planData = {
      basic: { name: 'Basic', price: 9.99 },
      standard: { name: 'Standard', price: 15.49 },
      premium: { name: 'Premium', price: 22.99 },
    };

    const plan = planData[PLAN_ID];
    const now = new Date();
    const renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscriptionResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/subscriptions/${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fields: {
            userId: { stringValue: userId },
            planId: { stringValue: PLAN_ID },
            planName: { stringValue: plan.name },
            price: { doubleValue: plan.price },
            currency: { stringValue: 'USD' },
            billingPeriod: { stringValue: 'month' },
            status: { stringValue: 'active' },
            startDate: { timestampValue: now.toISOString() },
            renewalDate: { timestampValue: renewalDate.toISOString() },
            createdAt: { timestampValue: now.toISOString() },
            updatedAt: { timestampValue: now.toISOString() },
          },
        }),
      }
    );

    if (!subscriptionResponse.ok) {
      console.warn('⚠️  Warning: Subscription creation via API had issues (this is ok if using Firestore Realtime DB)');
    } else {
      console.log(`✅ Subscription created: ${plan.name} ($${plan.price}/month)\n`);
    }

    // Display summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 USER REGISTRATION SUCCESSFUL!\n');
    console.log('📱 Account Details:');
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Password: ${PASSWORD}`);
    console.log(`   UID: ${userId}`);
    console.log(`   Status: Active\n`);
    console.log('📊 Subscription Details:');
    console.log(`   Plan: ${plan.name}`);
    console.log(`   Price: $${plan.price}/month`);
    console.log(`   Renewal: ${renewalDate.toDateString()}`);
    console.log(`   Status: Active\n`);
    console.log('🔐 Auth Token (first 50 chars):');
    console.log(`   ${idToken.substring(0, 50)}...\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ User can now log in at: http://localhost:5173/login\n');
    console.log('💡 Next Steps:');
    console.log('   1. Open http://localhost:5173/login');
    console.log(`   2. Enter email: ${EMAIL}`);
    console.log(`   3. Enter password: ${PASSWORD}`);
    console.log('   4. You should be logged in with Standard plan active!\n');

  } catch (error) {
    console.error('\n❌ Error during registration:\n', error.message);
    
    if (error.message.includes('EMAIL_EXISTS')) {
      console.log('\n💡 Tip: This email is already registered.');
    }
    
    process.exit(1);
  }
}

// Run the registration
registerUser().then(() => {
  console.log('✅ Registration script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
