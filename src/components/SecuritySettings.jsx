import { useState, useEffect } from 'react';
import { UserAuth } from '../utils/AuthContext';

export default function SecuritySettings() {
  const {
    user,
    getLoginActivity,
    getTrustedDevices,
    revokeDevice,
    setup2FA,
    get2FAStatus,
    disable2FA,
  } = UserAuth();

  const [activeTab, setActiveTab] = useState('devices');
  const [loading, setLoading] = useState(false);
  const [loginActivity, setLoginActivity] = useState([]);
  const [devices, setDevices] = useState([]);
  const [mfaStatus, setMfaStatus] = useState(null);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [backupCodes, setBackupCodes] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSecurityData();
  }, [user]);

  const loadSecurityData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const idToken = await user.getIdToken();

      // Load login activity
      const activityResult = await getLoginActivity(idToken, 10);
      if (activityResult.data?.activity) {
        setLoginActivity(activityResult.data.activity);
      }

      // Load trusted devices
      const devicesResult = await getTrustedDevices(idToken);
      if (devicesResult.data?.devices) {
        setDevices(devicesResult.data.devices);
      }

      // Load 2FA status
      const mfaResult = await get2FAStatus(idToken);
      if (mfaResult.data) {
        setMfaStatus(mfaResult.data);
      }
    } catch (err) {
      console.error('Error loading security data:', err);
      setError('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      setError('');
      const idToken = await user.getIdToken();
      const result = await setup2FA(idToken);

      if (result.success && result.data) {
        setQrCode(result.data.qrCode);
        setBackupCodes(result.data.backupCodes);
        setMessage('Scan the QR code with Google Authenticator or similar app');
      } else {
        setError(result.error?.message || 'Failed to setup 2FA');
      }
    } catch (err) {
      setError('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure? This will disable two-factor authentication.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const idToken = await user.getIdToken();
      const result = await disable2FA(idToken, user.uid); // In production, get password

      if (result.success) {
        setMessage('Two-factor authentication has been disabled');
        setMfaStatus({ enabled: false });
      } else {
        setError(result.error?.message || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    if (!window.confirm('Sign out from this device?')) return;

    try {
      setLoading(true);
      const idToken = await user.getIdToken();
      const result = await revokeDevice(idToken, deviceId);

      if (result.success) {
        setMessage(result.data?.message || 'Device removed');
        await loadSecurityData();
      } else {
        setError(result.error?.message || 'Failed to revoke device');
      }
    } catch (err) {
      setError('Failed to revoke device');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full bg-[#141414] text-white p-6 rounded-lg">
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        {['devices', 'activity', '2fa'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-2 font-semibold transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === '2fa' ? '2FA' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 bg-green-900/30 border border-green-600 rounded mb-6 text-green-400 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-600 rounded mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div>
          <h3 className="text-xl font-bold mb-4">Trusted Devices</h3>
          {devices.length === 0 ? (
            <p className="text-gray-400">No trusted devices yet</p>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded"
                >
                  <div>
                    <p className="font-semibold">{device.name}</p>
                    <p className="text-sm text-gray-400">
                      {device.browser} • {device.ipAddress}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last active: {formatDate(device.lastActive)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeDevice(device.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div>
          <h3 className="text-xl font-bold mb-4">Recent Login Activity</h3>
          {loginActivity.length === 0 ? (
            <p className="text-gray-400">No login activity</p>
          ) : (
            <div className="space-y-3">
              {loginActivity.map((activity, idx) => (
                <div key={idx} className="p-4 bg-gray-800 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {activity.success ? '✓ Successful Login' : '✗ Failed Login'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {activity.browser} • {activity.os} • {activity.location}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    {activity.requiresVerification && (
                      <span className="px-3 py-1 bg-yellow-900/30 border border-yellow-600 rounded text-yellow-400 text-xs font-semibold">
                        New Location
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2FA Tab */}
      {activeTab === '2fa' && (
        <div>
          <h3 className="text-xl font-bold mb-4">Two-Factor Authentication</h3>

          {!mfaStatus?.enabled ? (
            <div>
              <p className="text-gray-400 mb-6">
                Two-factor authentication adds an extra layer of security to your account.
              </p>

              {!qrCode ? (
                <button
                  onClick={handleSetup2FA}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-bold disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Enable 2FA'}
                </button>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold mb-3">Step 1: Scan QR Code</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Use Google Authenticator, Microsoft Authenticator, or similar app to scan:
                    </p>
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border-2 border-gray-700 p-2" />
                  </div>

                  {backupCodes.length > 0 && (
                    <div>
                      <h4 className="font-bold mb-3">Step 2: Save Backup Codes</h4>
                      <p className="text-sm text-gray-400 mb-3">
                        Save these codes in a safe place. Use them if you lose access to your authenticator app.
                      </p>
                      <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                        {backupCodes.map((code, idx) => (
                          <div key={idx} className="text-gray-300">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setQrCode(null);
                      setBackupCodes([]);
                      loadSecurityData();
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-bold"
                  >
                    I've Saved My Codes
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="p-4 bg-green-900/30 border border-green-600 rounded mb-6">
                <p className="font-semibold text-green-400">✓ Two-factor authentication is enabled</p>
              </div>

              <button
                onClick={handleDisable2FA}
                disabled={loading}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold disabled:opacity-50"
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
