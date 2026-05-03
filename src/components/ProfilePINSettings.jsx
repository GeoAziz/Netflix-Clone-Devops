import { useState } from 'react';
import { UserAuth } from '../utils/AuthContext';

export default function ProfilePINSettings({ profileId, profileName }) {
  const { user, setProfilePIN, verifyProfilePIN, hasProfilePIN, removeProfilePIN } = UserAuth();

  const [hasPin, setHasPin] = useState(false);
  const [showPINForm, setShowPINForm] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useState(() => {
    checkPINStatus();
  }, [profileId]);

  const checkPINStatus = async () => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const result = await hasProfilePIN(idToken, profileId);
      if (result.data) {
        setHasPin(result.data.hasPIN);
      }
    } catch (err) {
      console.error('Error checking PIN status:', err);
    }
  };

  const handleSetPIN = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate PIN
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      setLoading(true);
      const idToken = await user.getIdToken();
      const result = await setProfilePIN(idToken, profileId, pin);

      if (result.success) {
        setMessage(result.data?.message || 'PIN set successfully');
        setPin('');
        setConfirmPin('');
        setShowPINForm(false);
        setHasPin(true);
      } else {
        setError(result.error?.message || 'Failed to set PIN');
      }
    } catch (err) {
      setError('Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePIN = async () => {
    if (!window.confirm(`Remove PIN from "${profileName}"?`)) return;

    try {
      setLoading(true);
      setError('');
      const idToken = await user.getIdToken();
      const result = await removeProfilePIN(idToken, profileId);

      if (result.success) {
        setMessage(result.data?.message || 'PIN removed');
        setHasPin(false);
      } else {
        setError(result.error?.message || 'Failed to remove PIN');
      }
    } catch (err) {
      setError('Failed to remove PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Profile PIN - {profileName}</h3>

      {message && (
        <div className="p-3 bg-green-900/30 border border-green-600 rounded mb-4 text-green-400 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-600 rounded mb-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!hasPin ? (
        <div>
          <p className="text-gray-400 mb-4">
            Protect this profile with a PIN. Other household members will need to enter the PIN to access it.
          </p>

          {!showPINForm ? (
            <button
              onClick={() => setShowPINForm(true)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold transition-colors"
            >
              Set PIN
            </button>
          ) : (
            <form onSubmit={handleSetPIN} className="space-y-4 max-w-sm">
              <input
                type="password"
                inputMode="numeric"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 4).replace(/\D/g, ''))}
                maxLength="4"
                className="w-full p-3 bg-gray-700 rounded text-center text-2xl tracking-widest font-bold"
              />

              <input
                type="password"
                inputMode="numeric"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.slice(0, 4).replace(/\D/g, ''))}
                maxLength="4"
                className="w-full p-3 bg-gray-700 rounded text-center text-2xl tracking-widest font-bold"
              />

              <p className="text-xs text-gray-400">PIN must be exactly 4 digits (0-9)</p>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Setting...' : 'Set PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPINForm(false);
                    setPin('');
                    setConfirmPin('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div>
          <div className="p-3 bg-green-900/30 border border-green-600 rounded mb-4">
            <p className="font-semibold text-green-400">✓ PIN is enabled</p>
          </div>

          <button
            onClick={handleRemovePIN}
            disabled={loading}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Removing...' : 'Remove PIN'}
          </button>
        </div>
      )}
    </div>
  );
}
