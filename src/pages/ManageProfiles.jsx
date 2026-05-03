import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../utils/AuthContext';
import { FaEdit, FaTrash2, FaSave, FaTimes } from 'react-icons/fa';

const AVATAR_OPTIONS = [
  '🎬', '🍿', '🎭', '🎪', '👤', '🎮', '📺', '🌟',
  '🎸', '📚', '🎨', '⚽', '🏀', '🎯', '🚀', '💎',
  '🦁', '🐯', '🐻', '🐼', '🦊', '🐢', '🦅', '🐉'
];

const ManageProfiles = () => {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadProfiles();
    } else {
      navigate('/login');
    }
  }, [user?.uid, navigate]);

  const loadProfiles = () => {
    try {
      setLoading(true);
      const savedProfiles = localStorage.getItem(`profiles_${user?.uid}`);
      if (savedProfiles) {
        setProfiles(JSON.parse(savedProfiles));
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfilesToStorage = (updatedProfiles) => {
    try {
      localStorage.setItem(`profiles_${user?.uid}`, JSON.stringify(updatedProfiles));
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Error saving profiles:', error);
    }
  };

  const handleEdit = (profile) => {
    setEditingProfileId(profile.id);
    setEditName(profile.name);
    setEditAvatar(profile.avatar);
    setShowAvatarPicker(false);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      alert('Profile name cannot be empty');
      return;
    }

    const updatedProfiles = profiles.map((p) =>
      p.id === editingProfileId
        ? { ...p, name: editName, avatar: editAvatar }
        : p
    );

    saveProfilesToStorage(updatedProfiles);
    setEditingProfileId(null);
    setEditName('');
    setEditAvatar('');
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
    setEditName('');
    setEditAvatar('');
    setShowAvatarPicker(false);
  };

  const handleDeleteProfile = (profileId) => {
    if (profiles.length === 1) {
      alert('You must have at least one profile');
      return;
    }

    const updatedProfiles = profiles.filter((p) => p.id !== profileId);
    saveProfilesToStorage(updatedProfiles);
    setShowDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div>Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#141414] to-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Manage Profiles</h1>
          <p className="text-red-100">Edit or customize your profiles</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {profiles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-6">No profiles found. Create one to get started.</p>
            <button
              onClick={() => navigate('/profiles')}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-bold transition-colors"
            >
              Go to Profile Selection
            </button>
          </div>
        ) : (
          <>
            {/* Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-gray-900 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-red-600/20 transition-shadow"
                >
                  {/* Profile Card */}
                  {editingProfileId === profile.id ? (
                    // Edit Mode
                    <div className="p-8">
                      <h3 className="text-xl font-bold mb-6">Edit Profile</h3>

                      {/* Avatar Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold mb-3">
                          Profile Avatar
                        </label>
                        <div
                          onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                          className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-5xl cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {editAvatar}
                        </div>

                        {showAvatarPicker && (
                          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-400 mb-3">Select an avatar:</p>
                            <div className="grid grid-cols-6 gap-2">
                              {AVATAR_OPTIONS.map((avatar) => (
                                <button
                                  key={avatar}
                                  onClick={() => {
                                    setEditAvatar(avatar);
                                    setShowAvatarPicker(false);
                                  }}
                                  className={`w-12 h-12 rounded flex items-center justify-center text-xl transition-all ${
                                    editAvatar === avatar
                                      ? 'bg-red-600 ring-2 ring-red-400'
                                      : 'bg-gray-700 hover:bg-gray-600'
                                  }`}
                                >
                                  {avatar}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Name Input */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold mb-2">
                          Profile Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={30}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {editName.length}/30
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <FaSave size={16} />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <FaTimes size={16} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      {/* Profile Info */}
                      <div className="p-8 bg-gray-800">
                        <div className="flex flex-col items-center text-center mb-6">
                          <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-6xl mb-4">
                            {profile.avatar}
                          </div>
                          <h3 className="text-2xl font-bold">{profile.name}</h3>
                        </div>

                        {/* Profile Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-t border-b border-gray-700">
                          <div className="text-center">
                            <p className="text-gray-400 text-xs mb-1">Profile ID</p>
                            <p className="text-sm font-mono text-gray-300">
                              {profile.id.substring(0, 8)}...
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400 text-xs mb-1">Created</p>
                            <p className="text-sm text-gray-300">
                              {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Info Text */}
                        <p className="text-gray-400 text-sm mb-6">
                          You have <span className="font-bold text-white">{profiles.length}</span> profile
                          {profiles.length !== 1 ? 's' : ''} total.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-4 bg-gray-900 flex gap-2">
                        <button
                          onClick={() => handleEdit(profile)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <FaEdit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(profile.id)}
                          disabled={profiles.length === 1}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <FaTrash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Create New Profile Card */}
              {profiles.length < 5 && (
                <div className="bg-gray-900 rounded-lg overflow-hidden flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 hover:border-red-600 transition-colors cursor-pointer"
                onClick={() => navigate('/profiles')}>
                  <div className="text-5xl mb-4">➕</div>
                  <h3 className="text-xl font-bold text-center mb-2">Create New Profile</h3>
                  <p className="text-gray-400 text-sm text-center">
                    You can have up to 5 profiles
                  </p>
                  <button
                    onClick={() => navigate('/profiles')}
                    className="mt-4 bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-bold transition-colors"
                  >
                    Create
                  </button>
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full">
                  <h3 className="text-2xl font-bold mb-4">Delete Profile?</h3>
                  <p className="text-gray-400 mb-6">
                    Are you sure you want to delete the profile "
                    <span className="font-bold text-white">
                      {profiles.find((p) => p.id === showDeleteConfirm)?.name}
                    </span>
                    "? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteProfile(showDeleteConfirm);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-3 rounded font-bold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageProfiles;
