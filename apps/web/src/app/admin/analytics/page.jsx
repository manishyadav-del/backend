'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load analytics from global settings
    fetch('/api/global-settings?apiKey=demo')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAnalytics(data.data.analytics || {});
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
      const analyticsData = {
        gaId: formData.get('gaId'),
        gtmId: formData.get('gtmId'),
        clarityId: formData.get('clarityId'),
        metaPixelId: formData.get('metaPixelId'),
        linkedinTagId: formData.get('linkedinTagId'),
        searchConsoleId: formData.get('searchConsoleId'),
      };

      const res = await fetch('/api/global-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analytics: JSON.stringify(analyticsData) }),
      });

      if (!res.ok) {
        setError('Failed to save analytics settings');
        return;
      }

      setMessage('Analytics settings saved successfully');
    } catch (err) {
      setError('Something went wrong');
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics & Tracking</h1>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSave}>
        <div className="analytics-form">
          <div className="form-group">
            <label>Google Analytics ID</label>
            <input type="text" name="gaId" defaultValue={analytics?.googleAnalytics || ''} placeholder="G-XXXXXXXXXX" />
          </div>
          <div className="form-group">
            <label>Google Tag Manager ID</label>
            <input type="text" name="gtmId" defaultValue={analytics?.tagManager || ''} placeholder="GTM-XXXXXXX" />
          </div>
          <div className="form-group">
            <label>Microsoft Clarity ID</label>
            <input type="text" name="clarityId" defaultValue={analytics?.clarity || ''} placeholder="XXXXXXX" />
          </div>
          <div className="form-group">
            <label>Meta Pixel ID</label>
            <input type="text" name="metaPixelId" defaultValue={analytics?.metaPixel || ''} placeholder="XXXXXXXXXXXXXXX" />
          </div>
          <div className="form-group">
            <label>LinkedIn Insight Tag ID</label>
            <input type="text" name="linkedinTagId" defaultValue={analytics?.linkedinTag || ''} placeholder="XXXXXXX" />
          </div>
          <div className="form-group">
            <label>Google Search Console ID</label>
            <input type="text" name="searchConsoleId" defaultValue={analytics?.searchConsole || ''} placeholder="XXXXXXXXXX" />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}