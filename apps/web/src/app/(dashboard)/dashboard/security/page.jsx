'use client';

import { useEffect, useState, useCallback } from 'react';

const PROJECT_ID = 'default';

export default function SecurityPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // IP Blocking State
  const [blockedIps, setBlockedIps] = useState([]);
  const [ipToBlock, setIpToBlock] = useState('');
  const [ipsLoading, setIpsLoading] = useState(false);

  const loadBlockedIps = useCallback(async () => {
    setIpsLoading(true);
    try {
      const res = await fetch(`/api/security/ip-block?projectId=${PROJECT_ID}`);
      const data = await res.json();
      setBlockedIps(data.blockedIps || []);
    } catch {
      setError('Failed to load blocked IPs');
    } finally {
      setIpsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          setTwoFactorEnabled(data.user.twoFactorEnabled);
        }
        return loadBlockedIps();
      })
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [loadBlockedIps]);

  const handleSetup2FA = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to setup 2FA');
        return;
      }
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode, secret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid verification code');
        return;
      }
      setTwoFactorEnabled(true);
      setQrCode('');
      setSecret('');
      setVerificationCode('');
      setMessage('2FA enabled successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA?')) return;

    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to disable 2FA');
        return;
      }
      setTwoFactorEnabled(false);
      setMessage('2FA disabled successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  // Block IP handler
  const handleBlockIp = async (e) => {
    e.preventDefault();
    if (!ipToBlock) return;

    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/security/ip-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          ip: ipToBlock.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBlockedIps(data.blockedIps || []);
        setMessage(`Successfully blocked IP: ${ipToBlock}`);
        setIpToBlock('');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to block IP');
      }
    } catch {
      setError('Network error blocking IP');
    }
  };

  // Unblock IP handler
  const handleUnblockIp = async (ip) => {
    if (!confirm(`Are you sure you want to unblock IP: ${ip}?`)) return;

    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/security/ip-block?projectId=${PROJECT_ID}&ip=${encodeURIComponent(ip)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setBlockedIps(data.blockedIps || []);
        setMessage(`Successfully unblocked IP: ${ip}`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to unblock IP');
      }
    } catch {
      setError('Network error unblocking IP');
    }
  };

  if (loading) {
    return <div className="loading">Loading security settings...</div>;
  }

  return (
    <div className="security-page">
      <div className="page-header">
        <h1>Security Controls</h1>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="security-sections" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Card 1: Two Factor Auth */}
        <div className="section-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-h1)', margin: 0 }}>Two-Factor Authentication</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Add an extra layer of security to your admin account by requiring verification codes.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status:</span>
            <span className={twoFactorEnabled ? 'badge badge-published' : 'badge badge-draft'}>
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {!twoFactorEnabled && !qrCode && (
            <button className="btn-primary" onClick={handleSetup2FA} disabled={actionLoading} style={{ alignSelf: 'start' }}>
              {actionLoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          )}

          {qrCode && (
            <div className="twofa-setup" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Scan this QR code with Google Authenticator or Microsoft Authenticator:</p>
              <div style={{ display: 'flex', justifyContent: 'center', background: '#fff', padding: '0.5rem', borderRadius: 'var(--radius-sm)', width: 'fit-content', margin: '0 auto' }}>
                <img src={qrCode} alt="2FA QR Code" style={{ width: '160px', height: '160px' }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', wordBreak: 'break-all', margin: 0 }}>
                Secret: <code>{secret}</code>
              </p>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </div>
              <button 
                className="btn-primary" 
                onClick={handleVerify2FA} 
                disabled={actionLoading || verificationCode.length !== 6}
                style={{ width: '100%' }}
              >
                {actionLoading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          )}

          {twoFactorEnabled && (
            <button className="btn-danger" onClick={handleDisable2FA} disabled={actionLoading} style={{ alignSelf: 'start' }}>
              {actionLoading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          )}
        </div>

        {/* Card 2: IP Block Management */}
        <div className="section-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-h1)', margin: 0 }}>IP Access Control</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Block specific IP addresses from accessing the admin panel and public pages.
          </p>

          <form onSubmit={handleBlockIp} style={{ padding: 0, display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
            <input
              type="text"
              value={ipToBlock}
              onChange={(e) => setIpToBlock(e.target.value)}
              placeholder="e.g. 192.168.1.100"
              required
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button type="submit" className="btn-primary">Block IP</button>
          </form>

          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-h1)', margin: '0.5rem 0 0' }}>Blocked IP Addresses ({blockedIps.length})</h3>
          
          {ipsLoading ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading blocked list...</div>
          ) : blockedIps.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)' }}>
              No IP addresses are currently blocked.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {blockedIps.map(ip => (
                <div key={ip} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <code style={{ color: 'var(--danger)', fontWeight: 600 }}>{ip}</code>
                  <button 
                    type="button" 
                    className="btn-sm btn-danger" 
                    style={{ padding: '0.25rem 0.5rem' }}
                    onClick={() => handleUnblockIp(ip)}
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Other controls */}
        <div className="section-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-h1)', margin: 0 }}>Login History</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Monitor login history, inspect locations, and user agent info.</p>
          <a href="/dashboard/login-history" className="btn-secondary" style={{ alignSelf: 'start' }}>View Login History</a>
        </div>

        <div className="section-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-h1)', margin: 0 }}>Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Update your account password and profile settings details.</p>
          <a href="/dashboard/settings" className="btn-secondary" style={{ alignSelf: 'start' }}>Profile Settings</a>
        </div>

      </div>
    </div>
  );
}