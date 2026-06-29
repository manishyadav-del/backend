'use client';

import { useEffect, useState } from 'react';

export default function CompliancePage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletionMessage, setDeletionMessage] = useState('');
  const [deletionError, setDeletionError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDataDeletion = async () => {
    if (!confirm(`Are you sure you want to permanently delete all data for ${deleteEmail}?`)) return;
    setDeleting(true);
    setDeletionMessage('');
    setDeletionError('');

    try {
      const res = await fetch('/api/compliance/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: deleteEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDeletionError(data.error || 'Failed to process deletion request');
        return;
      }

      setDeletionMessage(`Successfully deleted data for ${deleteEmail}. (Removed ${data.details.leadsDeleted} leads, ${data.details.submissionsDeleted} form submissions)`);
      setDeleteEmail('');
    } catch (err) {
      setDeletionError('Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetch('/api/global-settings?apiKey=demo')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSettings({
            cookieConsent: data.data.cookieConsent ?? true,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData(e.target);
      const data = {
        cookieConsent: formData.get('cookieConsent') === 'on',
        formConsent: formData.get('formConsent') === 'on',
        privacyAccept: formData.get('privacyAccept') === 'on',
        marketingConsent: formData.get('marketingConsent') === 'on',
      };

      const res = await fetch('/api/global-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        setError('Failed to save compliance settings');
        return;
      }

      setMessage('Compliance settings saved successfully');
    } catch (err) {
      setError('Something went wrong');
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="compliance-page">
      <div className="page-header">
        <h1>Compliance</h1>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSave}>
        <div className="compliance-sections">
          <div className="section-card">
            <h2>Cookie Consent</h2>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" name="cookieConsent" defaultChecked={settings?.cookieConsent ?? true} />
                Enable cookie consent banner
              </label>
            </div>
          </div>

          <div className="section-card">
            <h2>Form Consent</h2>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" name="formConsent" defaultChecked={settings?.formConsent ?? true} />
                Require consent for form submissions
              </label>
            </div>
          </div>

          <div className="section-card">
            <h2>Privacy Settings</h2>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" name="privacyAccept" defaultChecked={settings?.privacyAccept ?? true} />
                Require privacy policy acceptance
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" name="marketingConsent" defaultChecked={settings?.marketingConsent ?? false} />
                Enable marketing consent checkbox
              </label>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      <div className="section-card" style={{ marginTop: '2rem' }}>
        <h2>Data Deletion Request (GDPR / CCPA)</h2>
        <p style={{ margin: '0.5rem 0 1.5rem 0', color: 'var(--text-muted, #888)' }}>
          Enter a user's email address to permanently remove all their associated leads and form submission data from the database. This action is irreversible.
        </p>
        
        {deletionMessage && <div className="success-message" style={{ color: 'var(--success-color, #10b981)', marginBottom: '1rem' }}>{deletionMessage}</div>}
        {deletionError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{deletionError}</div>}

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <input 
              type="email" 
              placeholder="user@example.com" 
              value={deleteEmail} 
              onChange={(e) => setDeleteEmail(e.target.value)}
            />
          </div>
          <button 
            type="button" 
            className="btn-danger" 
            onClick={handleDataDeletion}
            disabled={deleting || !deleteEmail}
          >
            {deleting ? 'Deleting...' : 'Delete Data'}
          </button>
        </div>
      </div>
    </div>
  );
}