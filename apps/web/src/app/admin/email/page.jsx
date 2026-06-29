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
        });
      }
      setError(null);
    } catch {
      setError('Failed to load email settings');
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
    return <div className="loading">Loading email settings...</div>;
  }

  return (
    <div className="email-page">
      <div className="page-header">
        <h1>Email Settings</h1>
        <button type="button" className="btn-sm" onClick={() => setShowTestForm(!showTestForm)}>
          {showTestForm ? 'Cancel Test' : '⚡ Test SMTP'}
        </button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showTestForm && (
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', marginBottom: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-h1)', marginBottom: '0.75rem' }}>Send SMTP Test Email</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter a recipient address below. This will test the SMTP host/port/credentials filled in the form below without needing to save them first.</p>
          <form onSubmit={handleTestEmail} style={{ padding: 0, display: 'flex', gap: '0.5rem' }}>
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="recipient@example.com"
              required
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={testing}>
              {testing ? 'Sending...' : 'Send Test'}
            </button>
          </form>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="settings-form" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div className="form-row">
            <div className="form-group">
              <label>SMTP Host</label>
              <input 
                type="text" 
                value={settings.smtpHost} 
                onChange={(e) => handleInputChange('smtpHost', e.target.value)} 
                placeholder="e.g. smtp.mailgun.org"
              />
            </div>
            <div className="form-group">
              <label>SMTP Port</label>
              <input 
                type="number" 
                value={settings.smtpPort} 
                onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value) || 587)} 
                placeholder="587"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>SMTP Username</label>
              <input 
                type="text" 
                value={settings.smtpUser} 
                onChange={(e) => handleInputChange('smtpUser', e.target.value)} 
                placeholder="username@domain.com"
              />
            </div>
            <div className="form-group">
              <label>SMTP Password</label>
              <input 
                type="password" 
                value={settings.smtpPass} 
                onChange={(e) => handleInputChange('smtpPass', e.target.value)} 
                placeholder="Password"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Form Email (From Address)</label>
            <input 
              type="email" 
              value={settings.formEmail} 
              onChange={(e) => handleInputChange('formEmail', e.target.value)} 
              placeholder="noreply@domain.com"
            />
          </div>

          <div className="form-group">
            <label>Auto-Reply Template</label>
            <textarea 
              value={settings.autoReplyTemplate} 
              onChange={(e) => handleInputChange('autoReplyTemplate', e.target.value)} 
              rows="4" 
              placeholder="Auto-reply email template for form submissions"
            />
          </div>

          <div className="form-group checkbox" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.adminAlerts} 
                onChange={(e) => handleInputChange('adminAlerts', e.target.checked)} 
              />
              Send admin alerts for new form submissions
            </label>
          </div>

          <div className="modal-actions" style={{ padding: 0, border: 'none', background: 'none' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}