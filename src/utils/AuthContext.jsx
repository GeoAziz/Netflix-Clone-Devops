import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  confirmPasswordReset,
} from 'firebase/auth';
import { setDoc, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState(null);

  async function signUp(email, password, planId = 'standard') {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = credential.user.uid;
    
    // Create user document
    await setDoc(doc(db, 'users', userId), {
      email,
      uid: userId,
      createdAt: new Date(),
      emailVerified: false,
      preferences: {
        language: 'English',
        subtitles: true,
        autoplay: true,
        notifications: true,
      },
    });

    // Save subscription via backend
    try {
      const idToken = await credential.user.getIdToken();
      const response = await fetch('/api/auth/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId,
          planId,
        }),
      });
      const result = await response.json();
      console.log('Subscription created:', result);
    } catch (error) {
      console.log('Subscription creation error:', error);
    }

    // Auto-create first profile
    try {
      const idToken = await credential.user.getIdToken();
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          profileName: email.split('@')[0] || 'Profile 1',
        }),
      });
      const result = await response.json();
      console.log('First profile created:', result);
    } catch (error) {
      console.log('First profile creation error:', error);
    }

    // Send email verification request to backend
    try {
      const response = await fetch('/api/auth/email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userId,
        }),
      });
      console.log('Email verification sent:', await response.json());
    } catch (error) {
      console.log('Email verification error:', error);
    }

    return credential;
  }

  async function logIn(email, password, rememberMe = false) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get ID token
    const idToken = await credential.user.getIdToken();

    // Record login activity to backend
    try {
      const response = await fetch('/api/auth/login-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          success: true,
        }),
      });
      const result = await response.json();
      console.log('Login activity recorded:', result);
    } catch (error) {
      console.log('Login activity error:', error);
    }

    // Store "remember me" preference
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedEmail', email);
    }

    return credential;
  }

  async function logOut() {
    return signOut(auth);
  }

  // Request password reset
  async function requestPasswordReset(email) {
    const response = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return response.json();
  }

  // Reset password with token
  async function resetPassword(token, newPassword) {
    const response = await fetch('/api/auth/password-reset', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return response.json();
  }

  // Verify email
  async function verifyEmail(token) {
    const response = await fetch('/api/auth/email-verification', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return response.json();
  }

  // Setup 2FA
  async function setup2FA(idToken) {
    const response = await fetch('/api/auth/2fa-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        action: 'generateSecret',
      }),
    });
    return response.json();
  }

  // Disable 2FA
  async function disable2FA(idToken, password) {
    const response = await fetch('/api/auth/2fa-setup', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ password }),
    });
    return response.json();
  }

  // Get 2FA status
  async function get2FAStatus(idToken) {
    const response = await fetch('/api/auth/2fa-setup', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    return response.json();
  }

  // Get login activity
  async function getLoginActivity(idToken, limit = 20) {
    const response = await fetch(`/api/auth/login-activity?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    return response.json();
  }

  // Get trusted devices
  async function getTrustedDevices(idToken) {
    const response = await fetch('/api/auth/devices', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    return response.json();
  }

  // Trust current device
  async function trustDevice(idToken, deviceName, trustDuration = 30) {
    const response = await fetch('/api/auth/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        deviceName,
        trustDuration,
      }),
    });
    return response.json();
  }

  // Revoke device
  async function revokeDevice(idToken, deviceId) {
    const response = await fetch('/api/auth/devices', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ deviceId }),
    });
    return response.json();
  }

  // Set profile PIN
  async function setProfilePIN(idToken, profileId, pin, currentPin = null) {
    const response = await fetch(`/api/auth/profile-pin?profileId=${profileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        action: 'set',
        pin,
        currentPin,
      }),
    });
    return response.json();
  }

  // Verify profile PIN
  async function verifyProfilePIN(idToken, profileId, pin) {
    const response = await fetch(`/api/auth/profile-pin?profileId=${profileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        action: 'verify',
        pin,
      }),
    });
    return response.json();
  }

  // Check if profile has PIN
  async function hasProfilePIN(idToken, profileId) {
    const response = await fetch(`/api/auth/profile-pin?profileId=${profileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    return response.json();
  }

  // Remove profile PIN
  async function removeProfilePIN(idToken, profileId) {
    const response = await fetch(`/api/auth/profile-pin?profileId=${profileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    return response.json();
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        // Auth
        signUp,
        logIn,
        logOut,
        user,
        loading,
        
        // Password reset
        requestPasswordReset,
        resetPassword,
        
        // Email verification
        verifyEmail,
        
        // 2FA
        setup2FA,
        disable2FA,
        get2FAStatus,
        mfaRequired,
        mfaToken,
        
        // Login activity
        getLoginActivity,
        
        // Device management
        getTrustedDevices,
        trustDevice,
        revokeDevice,
        
        // Profile PIN
        setProfilePIN,
        verifyProfilePIN,
        hasProfilePIN,
        removeProfilePIN,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function UserAuth() {
  return useContext(AuthContext);
}
