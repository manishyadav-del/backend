'use client';

import { useEffect, useState } from 'react';
import { emailSettingsApi } from '@/lib/api.js';

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    formEmail: '',
    autoReplyTemplate: '',
    adminAlerts: true,
    oneSignalAppId: '',
    oneSignalRestKey: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  
  // Test email inputs
  const [testRecipient, setTestRecipient] = useState('');
  const [showTestForm, setShowTestForm] = useState(false);

  const projectId = 'demo';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await emailSettingsApi.get(projectId);
      if (data.settings) {
        setSettings({
          smtpHost: data.settings.smtpHost || '',
          smtpPort: data.settings.smtpPort || 587,
          smtpUser: data.settings.smtpUser || '',
          smtpPass: data.settings.smtpPass || '',
          formEmail: data.settings.formEmail || '',
          autoReplyTemplate: data.settings.autoReplyTemplate || '',
          adminAlerts: data.settings.adminAlerts ?? true,
          oneSignalAppId: data.settings.oneSignalAppId || '',
          oneSignalRestKey: data.settings.oneSignalRestKey || '',
        });
      }
      setError(null);
    } catch {
      setError('Failed to load email & push notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage('');

    try {
      await emailSettingsApi.save({
        projectId,
        ...settings,
      });
      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    if (!testRecipient) return;

    setTesting(true);
    setError(null);
    setMessage('');

    try {
      const res = await fetch('/api/email-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPass: settings.smtpPass,
          toEmail: testRecipient,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Test email sent successfully! Check your inbox.');
        setTestRecipient('');
        setShowTestForm(false);
        setTimeout(() => setMessage(''), 4000);
      } else {
        setError(data.error || 'Failed to send test email');
      }
    } catch {
      setError('Connection error testing SMTP');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="loading" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading integrations settings...</div>;
  }

  return (
    <div className="email-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>CRM & Dispatch Integrations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Configure SendGrid SMTP dispatch and OneSignal Push Notification credentials.</p>
        </div>
        <button type="button" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => setShowTestForm(!showTestForm)}>
          {showTestForm ? 'Cancel Test' : '⚡ Test SMTP'}
        </button>
      </div>

      {message && <div className="alert alert-success" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)' }}>{message}</div>}
      {error && <div className="alert alert-error" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)' }}>{error}</div>}

      {showTestForm && (
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', animation: 'fadeIn 0.2s ease-out' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-h1)', marginBottom: '0.75rem', marginTop: 0 }}>Send SMTP Test Email</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter a recipient address below. This will test the SMTP configuration filled in the form below without needing to save it first.</p>
          <form onSubmit={handleTestEmail} style={{ padding: 0, display: 'flex', gap: '0.5rem' }}>
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="recipient@example.com"
              required
              style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
            <button type="submit" className="btn-primary" disabled={testing}>
              {testing ? 'Sending...' : 'Send Test'}
            </button>
          </form>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Card 1: SMTP Settings */}
        <div className="settings-form" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-h1)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>✉️ SendGrid SMTP Configuration</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SMTP Host</label>
              <input 
                type="text" 
                value={settings.smtpHost} 
                onChange={(e) => handleInputChange('smtpHost', e.target.value)} 
                placeholder="smtp.sendgrid.net"
                style={{ padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SMTP Port</label>
              <input 
                type="number" 
                value={settings.smtpPort} 
                onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value) || 587)} 
                placeholder="587"
                style={{ padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SMTP Username</label>
              <input 
                type="text" 
                value={settings.smtpUser} 
                onChange={(e) => handleInputChange('smtpUser', e.target.value)} 
                placeholder="apikey"
                style={{ padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SMTP Password / API Key</label>
              <input 
                type="password" 
                value={settings.smtpPass} 
                onChange={(e) => handleInputChange('smtpPass', e.target.value)} 
                placeholder="SG.xxxx"
                style={{ padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sender Email (From Address)</label>
            <input 
              type="email" 
              value={settings.formEmail} 
              onChange={(e) => handleInputChange('formEmail', e.target.value)} 
              placeholder="newsletter@ahealthplace.com"
              style={{ padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Auto-Reply Text Template</label>
            <textarea 
              value={settings.autoReplyTemplate} 
              onChange={(e) => handleInputChange('autoReplyTemplate', e.target.value)} 
              rows="3" 
              placeholder="Thank you for subscribing to our newsletter! Stay tuned for health updates."
              style={{ padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
            />
          </div>

          <div className="form-group checkbox" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="adminAlertsCheckbox"
              checked={settings.adminAlerts} 
              onChange={(e) => handleInputChange('adminAlerts', e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="adminAlertsCheckbox" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Send admin alerts for new lead submissions</label>
          </div>
        </div>

        {/* Card 2: OneSignal Settings */}
        <div className="settings-form" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-h1)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>🔔 OneSignal Push Notifications</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>OneSignal App ID</label>
              <input 
                type="text" 
                value={settings.oneSignalAppId} 
                onChange={(e) => handleInputChange('oneSignalAppId', e.target.value)} 
                placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                style={{ padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>REST API Key</label>
              <input 
                type="password" 
                value={settings.oneSignalRestKey} 
                onChange={(e) => handleInputChange('oneSignalRestKey', e.target.value)} 
                placeholder="OneSignal REST Key"
                style={{ padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving Settings...' : '💾 Save Integrations Config'}
          </button>
        </div>

      </form>
    </div>
  );
}