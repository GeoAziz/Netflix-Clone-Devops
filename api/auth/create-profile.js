import { db } from '../../lib/firebaseAdmin.js';
import { verifyToken } from '../../lib/verifyToken.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify token
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.uid;
    const { profileName } = req.body;

    // Validate profile name
    if (!profileName || profileName.trim() === '') {
      return res.status(400).json({ error: 'Profile name is required' });
    }

    // Check if user already has a profile
    const profilesRef = db.collection('userProfiles').doc(userId).collection('profiles');
    const existingProfiles = await profilesRef.limit(1).get();

    if (!existingProfiles.empty) {
      return res.status(400).json({ error: 'Profile already exists for this user' });
    }

    // Create the first profile
    const profileId = uuidv4();
    const now = new Date();

    const profileData = {
      profileId,
      name: profileName.trim(),
      avatar: 'avatar-1', // Default avatar
      isAdult: false,
      language: 'English',
      createdAt: now,
      updatedAt: now,
    };

    // Save to Firestore
    await profilesRef.doc(profileId).set(profileData);

    return res.status(200).json({
      success: true,
      message: 'First profile created successfully',
      profile: profileData,
    });
  } catch (error) {
    console.error('Create profile error:', error);
    return res.status(500).json({
      error: 'Failed to create profile',
      details: error.message,
    });
  }
}
