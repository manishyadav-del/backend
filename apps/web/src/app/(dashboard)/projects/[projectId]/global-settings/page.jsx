'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GlobalSettingsPage({ params }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { projectId } = params;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`/api/global-settings?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
        setLoading(false);
      });
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Parse JSON fields to ensure they are valid objects before sending
      let headerConfigParsed = settings.headerConfig;
      let footerConfigParsed = settings.footerConfig;
      
      if (typeof settings.headerConfig === 'string') {
        headerConfigParsed = JSON.parse(settings.headerConfig);
      }
      if (typeof settings.footerConfig === 'string') {
        footerConfigParsed = JSON.parse(settings.footerConfig);
      }

      const payload = {
        ...settings,
        headerConfig: headerConfigParsed,
        footerConfig: footerConfigParsed
      };

      const res = await fetch(`/api/global-settings?projectId=${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Settings saved successfully!');
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('Invalid JSON or network error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="global-settings">
      <div className="breadcrumbs">
        <Link href={`/projects/${projectId}`}>&larr; Back to Project</Link>
      </div>
      
      <div className="header-actions">
        <h1>Global Settings</h1>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message" style={{color: 'green', marginBottom: '1rem'}}>{success}</div>}

      <div className="settings-grid">
        <div className="card">
          <h2>Analytics & Tracking</h2>
          <div className="form-group">
            <label>Google Analytics ID</label>
            <input 
              type="text" 
              placeholder="G-XXXXXXXXXX" 
              value={settings?.gaTrackingId || ''} 
              onChange={e => setSettings({...settings, gaTrackingId: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Microsoft Clarity ID</label>
            <input 
              type="text" 
              value={settings?.clarityTrackingId || ''} 
              onChange={e => setSettings({...settings, clarityTrackingId: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Custom Head Scripts</label>
            <textarea 
              rows="4" 
              className="code-font" 
              placeholder="<script>...</script>" 
              value={settings?.customHeadScripts || ''}
              onChange={e => setSettings({...settings, customHeadScripts: e.target.value})}
            ></textarea>
          </div>
        </div>
        
        <div className="card">
          <h2>Layout Config</h2>
          <div className="form-group">
            <label>Header Config (JSON)</label>
            <textarea 
              rows="6" 
              className="code-font" 
              value={typeof settings?.headerConfig === 'string' ? settings.headerConfig : JSON.stringify(settings?.headerConfig || {}, null, 2)}
              onChange={e => setSettings({...settings, headerConfig: e.target.value})}
            ></textarea>
          </div>
          <div className="form-group">
            <label>Footer Config (JSON)</label>
            <textarea 
              rows="6" 
              className="code-font" 
              value={typeof settings?.footerConfig === 'string' ? settings.footerConfig : JSON.stringify(settings?.footerConfig || {}, null, 2)}
              onChange={e => setSettings({...settings, footerConfig: e.target.value})}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
