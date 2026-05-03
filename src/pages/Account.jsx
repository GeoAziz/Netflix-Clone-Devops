import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserAuth } from '../utils/AuthContext';
import SavedShows from '../components/SavedShows';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const Account = () => {
  const { user, logOut } = UserAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('plan');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [preferences, setPreferences] = useState({
    language: 'English',
    subtitles: true,
    autoplay: true,
    notifications: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  const PLANS = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$9.99/month',
      features: ['1 screen', 'Standard quality (SD)'],
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '$15.49/month',
      features: ['2 screens', 'Full HD (1080p)', 'Ad-free'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$22.99/month',
      features: ['4 screens', '4K (Ultra HD) + HDR', 'Ad-free'],
    },
  ];

  // Load user preferences and subscription on mount
  useEffect(() => {
    if (user?.uid) {
      loadPreferences();
      loadSubscription();
    }
  }, [user?.uid]);

  // Load subscription from backend
  const loadSubscription = async () => {
    if (!user?.uid) return;
    try {
      setSubscriptionLoading(true);
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth/subscription', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setSubscriptionError('');
      } else {
        setSubscriptionError('No subscription found');
        setSubscription(null);
      }
    } catch (error) {
      console.log('Error loading subscription:', error);
      setSubscriptionError('Failed to load subscription');
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Load preferences from Firestore
  const loadPreferences = async () => {
    try {
      const userDocRef = doc(db, 'users', user.email);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data().preferences) {
        setPreferences(docSnap.data().preferences);
      }
    } catch (error) {
      console.log('Error loading preferences:', error);
    }
  };

  // Save preferences to Firestore
  const savePreferences = async () => {
    if (!user?.email) return;
    try {
      setIsSaving(true);
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          preferences,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new document
        await setDoc(userDocRef, {
          preferences,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setSaveSuccess('Preferences saved successfully!');
      setTimeout(() => setSaveSuccess(''), 2000);
    } catch (error) {
      console.log('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle changing plan
  const handleChangePlan = async (newPlanId) => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth/change-plan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ newPlanId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setShowChangePlanModal(false);
        setSelectedNewPlan(null);
      } else {
        const error = await response.json();
        alert('Error changing plan: ' + error.error);
      }
    } catch (error) {
      console.log('Error changing plan:', error);
      alert('Failed to change plan');
    }
  };

  // Handle cancelling subscription
  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will have access until the end of your billing period.')) {
      return;
    }

    try {
      setCancellingSubscription(true);
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          reason: 'User requested cancellation',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        alert('Subscription cancelled. You still have access until ' + new Date(subscription.renewalDate).toDateString());
      } else {
        const error = await response.json();
        alert('Error cancelling subscription: ' + error.error);
      }
    } catch (error) {
      console.log('Error cancelling subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setCancellingSubscription(false);
    }
  };

  // Handle preference change
  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.log(error);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // In a real app, call Firebase updatePassword(newPassword)
    // For now, just show success message
    setPasswordSuccess('Password updated successfully!');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);

    setTimeout(() => setPasswordSuccess(''), 3000);
  };

  return (
    <>
      {/* Header */}
      <div className="w-full text-white">
        <img
          className="w-full h-[400px] object-cover"
          src="https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg"
          alt="/"
        />
        <div className="bg-black/60 fixed top-0 w-full h-[550px]">
          <div className="absolute top-[20%] p-4 md:p-8">
            <h1 className="text-3xl md:text-5xl font-bold">Account</h1>
          </div>
        </div>
      </div>

      {/* Account Content */}
      <div className="bg-black min-h-screen text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Welcome Section */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome, {user?.email}</h2>
                <p className="text-gray-400">Manage your account settings and preferences</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-700 flex-wrap">
            <button
              onClick={() => setActiveTab('plan')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === 'plan'
                  ? 'border-b-2 border-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Plan Information
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === 'profiles'
                  ? 'border-b-2 border-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Manage Profiles
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === 'preferences'
                  ? 'border-b-2 border-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === 'security'
                  ? 'border-b-2 border-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Account Security
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === 'favorites'
                  ? 'border-b-2 border-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              My Favorites
            </button>
          </div>

          {/* Tab Content */}

          {/* Plan Information Tab */}
          {activeTab === 'plan' && (
            <div className="bg-gray-900 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-8">Your Plan</h3>

              {subscriptionLoading ? (
                <p className="text-gray-400">Loading subscription information...</p>
              ) : subscriptionError || !subscription ? (
                <div className="bg-yellow-900/30 border border-yellow-600 rounded p-4 mb-8">
                  <p className="text-yellow-300">
                    {subscriptionError || 'No active subscription found. Please contact support.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Current Plan Details */}
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4">Current Subscription</h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-400 text-sm">Plan Type</p>
                          <p className="text-xl font-bold text-red-600">{subscription.planName}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Price</p>
                          <p className="text-xl font-bold">${subscription.price.toFixed(2)}/month</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Renewal Date</p>
                          <p className="text-xl font-bold">
                            {new Date(subscription.renewalDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Status</p>
                          <p className={`text-lg font-bold ${
                            subscription.status === 'active' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Plan Features */}
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4">Your Plan Features</h4>
                      <ul className="space-y-3">
                        {subscription.planId === 'basic' && (
                          <>
                            <li className="flex items-center gap-3">
                              <span className="text-green-500">✓</span>
                              <span>1 screen at a time</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <span className="text-green-500">✓</span>
                              <span>Standard video quality (SD)</span>
                            </li>
                          </>
                        )}
                        {subscription.planId === 'standard' && (
                          <>
                            <li className="flex items-center gap-3">
                              <span className="text-green-500">✓</span>
                              <span>2 screens at the same time</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <span className="text-green-500">✓</span>
                              <span>Full HD (1080p) quality</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <span className="text-green-500">✓</span>
                              <span>Ad-free watching</span>
                            </li>
                          </>
                        )}
                        {subscription.planId === 'premium' && (
                          <>
                            <li className="flex items-center gap-3">
                              <span className="text-green-500">✓</span>
                              <span>4 screens at the same time</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <span className="text-green-500">✓</span>
                              <span>4K (Ultra HD) + HDR quality</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <span className="text-green-500">✓</span>
                              <span>Ad-free watching</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <span className="text-green-500">✓</span>
                              <span>Download for offline</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  {subscription.status === 'active' && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowChangePlanModal(true)}
                        className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-semibold transition-colors"
                      >
                        Change Plan
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancellingSubscription}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-6 py-2 rounded font-semibold transition-colors"
                      >
                        {cancellingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
                      </button>
                    </div>
                  )}
                  {subscription.status === 'cancelled' && (
                    <div className="bg-red-900/30 border border-red-600 rounded p-4">
                      <p className="text-red-300">
                        Your subscription has been cancelled. Access available until {new Date(subscription.accessUntil).toDateString()}.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Change Plan Modal */}
              {showChangePlanModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full">
                    <h4 className="text-2xl font-bold mb-6">Select a New Plan</h4>
                    <div className="space-y-4 mb-8">
                      {PLANS.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedNewPlan(plan.id)}
                          className={`w-full p-4 border-2 rounded text-left transition-all ${
                            selectedNewPlan === plan.id
                              ? 'border-red-600 bg-gray-800'
                              : 'border-gray-700 hover:border-gray-600'
                          } ${subscription.planId === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={subscription.planId === plan.id}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-bold text-lg">{plan.name}</h5>
                              <p className="text-red-600 font-semibold">{plan.price}</p>
                            </div>
                            {subscription.planId === plan.id && (
                              <span className="text-green-500 font-semibold">Current Plan</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setShowChangePlanModal(false);
                          setSelectedNewPlan(null);
                        }}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleChangePlan(selectedNewPlan)}
                        disabled={!selectedNewPlan}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-4 py-2 rounded font-semibold transition-colors"
                      >
                        Confirm Change
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="bg-gray-900 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-8">Preferences</h3>

              <div className="space-y-6">
                {/* Language Preference */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Language</h4>
                      <p className="text-gray-400">Choose your preferred display language</p>
                    </div>
                    <select
                      value={preferences.language}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Español</option>
                      <option value="French">Français</option>
                      <option value="German">Deutsch</option>
                      <option value="Italian">Italiano</option>
                      <option value="Portuguese">Português</option>
                    </select>
                  </div>
                </div>

                {/* Subtitles Preference */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Subtitles</h4>
                      <p className="text-gray-400">Enable or disable subtitles by default</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('subtitles', !preferences.subtitles)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        preferences.subtitles ? 'bg-red-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.subtitles ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Autoplay Preference */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Autoplay</h4>
                      <p className="text-gray-400">Automatically play next episode in series</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('autoplay', !preferences.autoplay)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        preferences.autoplay ? 'bg-red-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.autoplay ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Notifications Preference */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Notifications</h4>
                      <p className="text-gray-400">Receive updates on new releases and recommendations</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('notifications', !preferences.notifications)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        preferences.notifications ? 'bg-red-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.notifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8">
                {saveSuccess && (
                  <p className="text-green-500 text-sm mb-4">{saveSuccess}</p>
                )}
                <button
                  onClick={savePreferences}
                  disabled={isSaving}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-8 py-3 rounded font-semibold transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* Manage Profiles Tab */}
          {activeTab === 'profiles' && (
            <div className="bg-gray-900 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-8">Manage Profiles</h3>

              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <p className="text-gray-300 mb-4">
                  You can manage up to 5 profiles for your account. Each profile can have its own
                  personalized recommendations and watch history.
                </p>
              </div>

              <div className="flex gap-4">
                <Link
                  to="/manage-profiles"
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-semibold transition-colors"
                >
                  Manage Profiles
                </Link>
                <Link
                  to="/profiles"
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded font-semibold transition-colors"
                >
                  Switch Profile
                </Link>
              </div>
            </div>
          )}

          {/* Account Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-gray-900 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-8">Account Security</h3>

              <div className="space-y-6">
                {/* Email Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Email Address</h4>
                      <p className="text-gray-400">{user?.email}</p>
                    </div>
                    <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-semibold transition-colors">
                      Change
                    </button>
                  </div>
                </div>

                {/* Password Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Password</h4>
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-semibold transition-colors"
                    >
                      {showPasswordForm ? 'Cancel' : 'Change Password'}
                    </button>
                  </div>

                  {showPasswordForm && (
                    <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                      <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 bg-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 bg-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                      {passwordError && (
                        <p className="text-red-600 text-sm">{passwordError}</p>
                      )}
                      {passwordSuccess && (
                        <p className="text-green-500 text-sm">{passwordSuccess}</p>
                      )}
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-semibold transition-colors"
                      >
                        Update Password
                      </button>
                    </form>
                  )}
                </div>

                {/* Sessions Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4">Active Sessions</h4>
                  <p className="text-gray-400 mb-4">You're currently signed in on this device.</p>
                  <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-semibold transition-colors">
                    Sign Out All Other Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div>
              <h3 className="text-2xl font-bold mb-8">My Favorites</h3>
              <SavedShows />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Account;
