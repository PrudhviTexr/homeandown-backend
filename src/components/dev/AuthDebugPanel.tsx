import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AuthDebugPanel: React.FC = () => {
  const { user, getUserProfile } = useAuth();

  const clearCache = () => {
    try {
      sessionStorage.removeItem('auth_profile');
      console.log('[AUTH-DEBUG] Cleared sessionStorage auth_profile');
      window.location.reload();
    } catch (e) {
      console.error('[AUTH-DEBUG] Failed to clear cache', e);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await getUserProfile(true);
      console.log('[AUTH-DEBUG] Refreshed profile', profile);
      alert('Profile refreshed. See console for details.');
    } catch (e) {
      console.error('[AUTH-DEBUG] Refresh failed', e);
      alert('Failed to refresh profile (see console)');
    }
  };

  if (import.meta.env.PROD) return null;

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 99999 }}>
      <div style={{ background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.2)', fontSize: 12 }}>
        <div style={{ marginBottom: 6, fontWeight: 600 }}>Auth Debug</div>
        <div style={{ marginBottom: 8 }}>
          <div><strong>Cached:</strong> {user ? (user.email ?? 'unknown') : 'none'}</div>
          <div style={{ marginTop: 6 }}>
            <button onClick={refreshProfile} style={{ marginRight: 8, padding: '6px 8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4 }}>Refresh</button>
            <button onClick={clearCache} style={{ padding: '6px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4 }}>Clear Cache</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPanel;
