'use client';

import { useState, useEffect } from 'react';

export default function FeatureManagerPage() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Available universal features in Global Backend
  const availableFeatures = [
    { key: 'cms', name: 'Dynamic CMS Block Builder', desc: 'Allows real-time blocks, text, and banner synchronization.' },
    { key: 'seo', name: 'SEO & Meta Tags Manager', desc: 'Edits meta tags, keywords, canonical URLs, and Open Graph attributes.' },
    { key: 'blog', name: 'Universal Blog Engine', desc: 'Enables dynamic article authoring, categories, and sitemaps.' },
    { key: 'forms', name: 'Universal Leads Forms', desc: 'Injects forms and collects customer submissions into Leads repository.' },
    { key: 'media', name: 'Cloud Media Library', desc: 'Integrates cloud-stored assets, checking formats and sizes.' },
    { key: 'analytics', name: 'Real-time Visitors Analytics', desc: 'Tracks active sessions, device configurations, and logging.' },
    { key: 'legal', name: 'Compliance & Legal Documents', desc: 'Manages terms, privacy policies, and cookie consent modals.' }
  ];

  const [enabledFeatures, setEnabledFeatures] = useState({
    cms: true,
    seo: true,
    blog: false,
    forms: false,
    media: false,
    analytics: false,
    legal: false
  });

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    if (selectedWebsiteId) {
      loadWebsiteFeatures(selectedWebsiteId);
    }
  }, [selectedWebsiteId]);

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/websites');
      const json = await res.json();
      if (json.success) {
        setWebsites(json.data || []);
        if (json.data && json.data.length > 0) {
          setSelectedWebsiteId(json.data[0].id);
        }
      } else {
        setError(json.error || 'Failed to fetch websites');
      }
    } catch (err) {
      setError('Error loading websites.');
    } finally {
      setLoading(false);
    }
  };

  const loadWebsiteFeatures = async (websiteId) => {
    const site = websites.find(w => w.id === websiteId);
    if (!site) return;

    // Try parsing modules from connectedWebsite
    let modulesConfig = {
      cms: true,
      seo: true,
      blog: false,
      forms: false,
      media: false,
      analytics: false,
      legal: false
    };

    try {
      if (site.modules) {
        const parsed = typeof site.modules === 'string' ? JSON.parse(site.modules) : site.modules;
        modulesConfig = { ...modulesConfig, ...parsed };
      }
    } catch (e) {
      console.warn('Error parsing modules configuration:', e);
    }

    setEnabledFeatures(modulesConfig);
  };

  const handleToggle = (key) => {
    setEnabledFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!selectedWebsiteId) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/websites/${selectedWebsiteId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: enabledFeatures })
      });
      const json = await res.json();
      if (json.success) {
        alert('Universal features configuration updated and synced with client successfully!');
        // Update local list
        setWebsites(prev => prev.map(w => w.id === selectedWebsiteId ? { ...w, modules: JSON.stringify(enabledFeatures) } : w));
      } else {
        alert(json.error || 'Failed to save configuration');
      }
    } catch (err) {
      alert('Error updating configuration: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="features-page" style={{ padding: '1.5rem', background: 'var(--bg-base)', minHeight: '80vh' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Universal Feature System</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Enable or disable backend modules to automatically inject capabilities in connected applications.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading websites...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
          {/* Left panel - site select */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1rem', height: 'fit-content' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Website Target</label>
            <select
              value={selectedWebsiteId}
              onChange={(e) => setSelectedWebsiteId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            >
              {websites.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {/* Right panel - feature lists */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-h1)', margin: 0 }}>Active Modules Config</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '0.6rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'bold', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Syncing...' : 'Save & Propagate Modules'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {availableFeatures.map(feat => (
                <div
                  key={feat.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem',
                    background: 'var(--bg-base)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ flex: 1, paddingRight: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-h1)', margin: 0 }}>{feat.name}</h3>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        background: enabledFeatures[feat.key] ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: enabledFeatures[feat.key] ? 'var(--primary)' : 'var(--text-muted)'
                      }}>
                        {enabledFeatures[feat.key] ? 'active' : 'inactive'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>{feat.desc}</p>
                  </div>
                  <div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                      <input
                        type="checkbox"
                        checked={enabledFeatures[feat.key] || false}
                        onChange={() => handleToggle(feat.key)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: enabledFeatures[feat.key] ? 'var(--primary)' : '#ccc',
                        transition: '.4s',
                        borderRadius: '34px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '18px', width: '18px',
                          left: enabledFeatures[feat.key] ? '26px' : '4px',
                          bottom: '4px',
                          backgroundColor: 'white',
                          transition: '.4s',
                          borderRadius: '50%'
                        }} />
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
