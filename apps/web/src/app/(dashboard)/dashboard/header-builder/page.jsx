'use client';

import { useEffect, useState, useCallback } from 'react';

const PROJECT_ID = 'default';

export default function HeaderBuilderPage() {
  const [logo, setLogo] = useState('');
  const [sticky, setSticky] = useState(true);
  const [style, setStyle] = useState('modern');
  const [navLinks, setNavLinks] = useState([]);
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [transparent, setTransparent] = useState(false);
  const [announcementBarActive, setAnnouncementBarActive] = useState(false);
  const [announcementBarText, setAnnouncementBarText] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadHeader = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/global-settings/header?projectId=${PROJECT_ID}`);
      const data = await res.json();
      if (data.success && data.data) {
        const config = data.data;
        setLogo(config.logo || '');
        setSticky(config.sticky ?? true);
        setStyle(config.style || 'modern');
        setNavLinks(config.navLinks || []);
        setCtaText(config.ctaText || '');
        setCtaLink(config.ctaLink || '');
        setTransparent(config.transparent ?? false);
        setAnnouncementBarActive(config.announcementBarActive ?? false);
        setAnnouncementBarText(config.announcementBarText || '');
      }
    } catch {
      setError('Failed to load header settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHeader();
  }, [loadHeader]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/global-settings/header', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          logo,
          sticky,
          style,
          navLinks,
          ctaText,
          ctaLink,
          transparent,
          announcementBarActive,
          announcementBarText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Header settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch {
      setError('Connection error. Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = () => {
    setNavLinks([...navLinks, { label: '', href: '' }]);
  };

  const handleRemoveLink = (index) => {
    setNavLinks(navLinks.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index, field, value) => {
    const updated = navLinks.map((link, i) => {
      if (i === index) {
        return { ...link, [field]: value };
      }
      return link;
    });
    setNavLinks(updated);
  };

  const moveLink = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === navLinks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...navLinks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setNavLinks(updated);
  };

  return (
    <div className="header-builder-page">
      <form onSubmit={handleSave}>
        <div className="page-header">
          <h1>Header Builder</h1>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Header'}
          </button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">Loading header settings...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            <div className="builder-form" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-h1)' }}>Logo &amp; Layout</h2>
              
              <div className="form-group">
                <label>Logo URL</label>
                <input 
                  type="text" 
                  value={logo} 
                  onChange={(e) => setLogo(e.target.value)} 
                  placeholder="/logo.png or https://..."
                />
              </div>

              <div className="form-group">
                <label>Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)}>
                  <option value="modern">Modern (Centered links, glassy)</option>
                  <option value="classic">Classic (Logo left, links right)</option>
                  <option value="minimal">Minimal (Sidebar/compact menu)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
                <div className="form-group checkbox">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={sticky} 
                      onChange={(e) => setSticky(e.target.checked)} 
                    />
                    Sticky Header
                  </label>
                </div>

                <div className="form-group checkbox">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={transparent} 
                      onChange={(e) => setTransparent(e.target.checked)} 
                    />
                    Transparent on Hero
                  </label>
                </div>
              </div>

              <h2 style={{ fontSize: '1.25rem', margin: '2rem 0 1.5rem', color: 'var(--text-h1)' }}>Call To Action (CTA)</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>CTA Button Text</label>
                  <input 
                    type="text" 
                    value={ctaText} 
                    onChange={(e) => setCtaText(e.target.value)} 
                    placeholder="e.g. Get Started"
                  />
                </div>
                <div className="form-group">
                  <label>CTA Button Link</label>
                  <input 
                    type="text" 
                    value={ctaLink} 
                    onChange={(e) => setCtaLink(e.target.value)} 
                    placeholder="/contact"
                  />
                </div>
              </div>

              <h2 style={{ fontSize: '1.25rem', margin: '2rem 0 1.5rem', color: 'var(--text-h1)' }}>Announcement Bar</h2>
              
              <div className="form-group checkbox">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                  <input 
                    type="checkbox" 
                    checked={announcementBarActive} 
                    onChange={(e) => setAnnouncementBarActive(e.target.checked)} 
                  />
                  Enable Announcement Bar
                </label>
              </div>

              <div className="form-group">
                <label>Announcement Text</label>
                <input 
                  type="text" 
                  value={announcementBarText} 
                  onChange={(e) => setAnnouncementBarText(e.target.value)} 
                  placeholder="e.g. Special offer! Get 20% off today."
                  disabled={!announcementBarActive}
                />
              </div>
            </div>

            <div className="navigation-links-section" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-h1)' }}>Navigation Links</h2>
                <button type="button" className="btn-sm" onClick={handleAddLink}>+ Add Link</button>
              </div>

              {navLinks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  No navigation links added. Click "+ Add Link" to create one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {navLinks.map((link, index) => (
                    <div key={index} className="link-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          value={link.label} 
                          onChange={(e) => handleLinkChange(index, 'label', e.target.value)} 
                          placeholder="Label (e.g. About)" 
                          required
                          style={{ padding: '0.5rem' }}
                        />
                        <input 
                          type="text" 
                          value={link.href} 
                          onChange={(e) => handleLinkChange(index, 'href', e.target.value)} 
                          placeholder="URL (e.g. /about)" 
                          required
                          style={{ padding: '0.5rem' }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <button 
                          type="button" 
                          className="btn-sm" 
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => moveLink(index, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button 
                          type="button" 
                          className="btn-sm" 
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => moveLink(index, 'down')}
                          disabled={index === navLinks.length - 1}
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>

                      <button 
                        type="button" 
                        className="btn-sm btn-danger" 
                        style={{ padding: '0.5rem 0.75rem', height: '100%', display: 'flex', alignItems: 'center' }}
                        onClick={() => handleRemoveLink(index)}
                        title="Remove Link"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}