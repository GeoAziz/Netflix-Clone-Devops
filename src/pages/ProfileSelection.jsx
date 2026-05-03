import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../utils/AuthContext';

const DEFAULT_PROFILES = [
  {
    id: '1',
    name: 'Main Profile',
    avatar: '🎬'
  },
  {
    id: '2',
    name: 'Kids',
    avatar: '🍿'
  },
  {
    id: '3',
    name: 'Documentary',
    avatar: '🎥'
  }
];

const AVATAR_OPTIONS = ['🎬', '🍿', '🎭', '🎪', '👤', '🎮', '📺', '🌟'];

export default function ProfileSelection() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  useEffect(() => {
    // In a real app, fetch profiles from Firestore
    // For now, use mock profiles from localStorage or defaults
    const savedProfiles = localStorage.getItem(`profiles_${user?.uid}`);
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    }
  }, [user?.uid]);

  const handleSelectProfile = (profileId) => {
    localStorage.setItem('selectedProfile', profileId);
    localStorage.setItem(`selectedProfileName_${user?.uid}`, 
      profiles.find(p => p.id === profileId)?.name || 'Profile');
    navigate('/');
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    
    if (profiles.length >= 5) {
      alert('Maximum 5 profiles allowed');
      return;
    }

    const newProfile = {
      id: Date.now().toString(),
      name: newProfileName,
      avatar: selectedAvatar
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem(`profiles_${user?.uid}`, JSON.stringify(updatedProfiles));
    
    // Auto-select the new profile
    handleSelectProfile(newProfile.id);
    setNewProfileName('');
    setShowCreateForm(false);
  };

  const handleDeleteProfile = (profileId) => {
    if (profiles.length === 1) {
      alert('You must have at least one profile');
      return;
    }
    
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    localStorage.setItem(`profiles_${user?.uid}`, JSON.stringify(updatedProfiles));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#141414] to-black flex flex-col items-center justify-center px-4">
      {/* Netflix Logo */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-[#E50914]">NETFLIX</h1>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl text-white mb-2">Who's watching?</h2>
        <p className="text-gray-400">Select or create a profile to get started</p>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12 max-w-4xl">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex flex-col items-center cursor-pointer group"
          >
            <button
              onClick={() => handleSelectProfile(profile.id)}
              className="relative mb-4 transition-transform transform group-hover:scale-110"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-4xl border-2 border-transparent group-hover:border-[#E50914] transition-colors">
                {profile.avatar}
              </div>
            </button>
            <p className="text-white text-center text-sm font-medium">{profile.name}</p>
            <button
              onClick={() => handleDeleteProfile(profile.id)}
              className="text-xs text-gray-500 hover:text-red-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Delete
            </button>
          </div>
        ))}

        {/* Create Profile Button */}
        {profiles.length < 5 && (
          <div className="flex flex-col items-center cursor-pointer group">
            <button
              onClick={() => setShowCreateForm(true)}
              className="relative mb-4 transition-transform transform group-hover:scale-110"
            >
              <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center text-4xl border-2 border-dashed border-gray-600 group-hover:border-[#E50914] transition-colors">
                +
              </div>
            </button>
            <p className="text-white text-center text-sm font-medium">Add Profile</p>
          </div>
        )}
      </div>

      {/* Create Profile Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl text-white mb-6 font-semibold">Create New Profile</h3>

            {/* Profile Name Input */}
            <div className="mb-6">
              <label className="block text-white text-sm mb-2">Profile Name</label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter profile name"
                maxLength="20"
                autoFocus
                className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-[#E50914] focus:outline-none transition-colors"
              />
            </div>

            {/* Avatar Selection */}
            <div className="mb-6">
              <label className="block text-white text-sm mb-3">Choose Avatar</label>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`py-3 text-2xl rounded border-2 transition-colors ${
                      selectedAvatar === emoji
                        ? 'border-[#E50914] bg-gray-700'
                        : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Preview */}
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-2xl">
                {selectedAvatar}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProfileName('');
                  setSelectedAvatar(AVATAR_OPTIONS[0]);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProfile}
                disabled={!newProfileName.trim()}
                className="flex-1 bg-[#E50914] hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 rounded transition-colors font-semibold"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Profiles & Sign Out */}
      <div className="mt-12 flex gap-6 text-sm">
        <Link
          to="/account"
          className="text-gray-400 hover:text-white transition-colors"
        >
          Manage Profiles
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem('selectedProfile');
            // Logout handled via account page
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Switch Account
        </button>
      </div>
    </div>
  );
}
