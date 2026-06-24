'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import WebsiteAssignmentTab from '@/components/WebsiteAssignmentTab.jsx';

const PROJECT_ID = 'default';

export default function HeaderBuilderPage() {
  const [activeTab, setActiveTab] = useState('editor'); // editor, assignments
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

  // Simulator & Websites Preview states
  const [websites, setWebsites] = useState([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [previewPath, setPreviewPath] = useState('/');
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const iframeRef = useRef(null);

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

  const fetchWebsites = async () => {
    try {
      const res = await fetch('/api/websites');
      const json = await res.json();
      if (json.success) {
        setWebsites(json.data || []);
        if (json.data?.length > 0) {
          setSelectedWebsiteId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching websites:', err);
    }
  };

  useEffect(() => {
    loadHeader();
    fetchWebsites();

    // Socket status link
    const initSocket = async () => {
      try {
        await fetch('/api/socket').catch(() => {});
        const socket = io({ path: '/api/socket', reconnectionDelay: 2000 });
        socketRef.current = socket;
        socket.on('connect', () => {
          setSocketStatus('connected');
        });
        socket.on('disconnect', () => setSocketStatus('disconnected'));
      } catch {
        setSocketStatus('disconnected');
      }
    };
    initSocket();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [loadHeader]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
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
        setMessage('Header settings published & synced live!');
        setTimeout(() => setMessage(''), 3000);
        
        // Manual reload fallback in case socket latency
        if (iframeRef.current) {
          setTimeout(() => {
            try {
              iframeRef.current.src = iframeRef.current.src;
            } catch (e) {}
          }, 800);
        }
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

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);
  const getIframeUrl = () => {
    if (!selectedWebsite) return '';
    let domain = selectedWebsite.domain;
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
      domain = 'http://' + domain;
    }
    const path = previewPath.includes('?') ? `${previewPath}&isolateComponent=Header` : `${previewPath}?isolateComponent=Header`;
    return `${domain}${path}`;
  };
  const iframeUrl = getIframeUrl();

  const inp = { 
    width: '100%', 
    padding: '0.6rem 0.8rem', 
    borderRadius: 'var(--radius-md)', 
    border: '1px solid var(--border-strong)', 
    background: 'var(--bg-base)', 
    color: 'var(--text-primary)', 
    fontSize: '0.875rem' 
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-base)', minHeight: '85vh' }}>
      {/* Page Title & Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Header Builder</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Configure logo, navigation styling, CTA links, and announcement bar settings.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: socketStatus === 'connected' ? '#10b981' : '#6b7280' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: socketStatus === 'connected' ? '#10b981' : '#6b7280', display: 'inline-block' }} />
            {socketStatus === 'connected' ? 'Live Link Connected' : 'Offline Mode'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem', gap: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('editor')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'editor' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'editor' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'editor' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          Header Editor Workspace
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'assignments' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'assignments' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'assignments' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          Website Assignment
        </button>
      </div>

      {activeTab === 'editor' && (
        <div>
          {message && <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{message}</div>}
          {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading settings...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 500px', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* Left Column: Config Forms */}
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Changes publish immediately to all websites.</span>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}>
                    {saving ? 'Publishing...' : '💾 Save & Publish'}
                  </button>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🖼️ Logo & Layout
                  </h2>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Logo URL</label>
                    <input 
                      type="text" 
                      value={logo} 
                      onChange={(e) => setLogo(e.target.value)} 
                      placeholder="/logo.png or https://..."
                      style={inp}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Style Variant</label>
                    <select value={style} onChange={(e) => setStyle(e.target.value)} style={inp}>
                      <option value="modern">Modern (Centered links, glassy navbar)</option>
                      <option value="classic">Classic (Logo left, links right)</option>
                      <option value="minimal">Minimal (Compact/sidebar menu)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', marginTop: '1.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={sticky} 
                        onChange={(e) => setSticky(e.target.checked)} 
                      />
                      Sticky Header (Fixed on scroll)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={transparent} 
                        onChange={(e) => setTransparent(e.target.checked)} 
                      />
                      Transparent Background on Hero
                    </label>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚡ Call To Action Button (CTA)
                  </h2>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Button Label</label>
                      <input 
                        type="text" 
                        value={ctaText} 
                        onChange={(e) => setCtaText(e.target.value)} 
                        placeholder="e.g. Schedule Appointment"
                        style={inp}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Button Target Link</label>
                      <input 
                        type="text" 
                        value={ctaLink} 
                        onChange={(e) => setCtaLink(e.target.value)} 
                        placeholder="e.g. /contact"
                        style={inp}
                      />
                    </div>
                  </div>
                </div>

                {/* Announcement Bar */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📣 Announcement Bar Banner
                  </h2>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                      <input 
                        type="checkbox" 
                        checked={announcementBarActive} 
                        onChange={(e) => setAnnouncementBarActive(e.target.checked)} 
                      />
                      Enable Top Announcement Banner
                    </label>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Banner Text Content</label>
                    <input 
                      type="text" 
                      value={announcementBarText} 
                      onChange={(e) => setAnnouncementBarText(e.target.value)} 
                      placeholder="e.g. 🎉 Special Announcement: We are now accepting new patients!"
                      disabled={!announcementBarActive}
                      style={inp}
                    />
                  </div>
                </div>

                {/* Navigation Links */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔗 Navigation Links Menu
                    </h2>
                    <button type="button" className="btn-sm" onClick={handleAddLink}>+ Add Link</button>
                  </div>

                  {navLinks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No custom menu links yet. Click "+ Add Link" to build your custom menu.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {navLinks.map((link, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input 
                              type="text" 
                              value={link.label} 
                              onChange={(e) => handleLinkChange(index, 'label', e.target.value)} 
                              placeholder="Link Label (e.g., Services)" 
                              required
                              style={{ ...inp, padding: '0.4rem 0.6rem' }}
                            />
                            <input 
                              type="text" 
                              value={link.href} 
                              onChange={(e) => handleLinkChange(index, 'href', e.target.value)} 
                              placeholder="Target URL (e.g., /services)" 
                              required
                              style={{ ...inp, padding: '0.4rem 0.6rem' }}
                            />
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <button 
                              type="button" 
                              className="btn-sm" 
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }}
                              onClick={() => moveLink(index, 'up')}
                              disabled={index === 0}
                            >
                              ▲
                            </button>
                            <button 
                              type="button" 
                              className="btn-sm" 
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }}
                              onClick={() => moveLink(index, 'down')}
                              disabled={index === navLinks.length - 1}
                            >
                              ▼
                            </button>
                          </div>

                          <button 
                            type="button" 
                            className="btn-sm btn-danger" 
                            style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleRemoveLink(index)}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>

              {/* Right Column: Live Iframe Preview Workspace */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1.5rem' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-h1)', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🌐 Live Website Preview
                  </h3>
                  
                  {/* Select website */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600 }}>Select Website to Preview</label>
                    <select
                      value={selectedWebsiteId}
                      onChange={(e) => setSelectedWebsiteId(e.target.value)}
                      style={inp}
                    >
                      {websites.map(site => (
                        <option key={site.id} value={site.id}>{site.name} ({site.domain})</option>
                      ))}
                    </select>
                  </div>

                  {/* Route input path selector */}
                  <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600 }}>Page Path Route</label>
                      <input 
                        type="text" 
                        value={previewPath} 
                        onChange={(e) => setPreviewPath(e.target.value)} 
                        placeholder="/"
                        style={inp}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn-sm" 
                      style={{ height: '38px', marginTop: '17px', padding: '0 1rem' }}
                      onClick={() => {
                        if (iframeRef.current) iframeRef.current.src = getIframeUrl();
                      }}
                    >
                      🔄 Reload
                    </button>
                  </div>

                  {/* Responsive controls */}
                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
                    {['desktop', 'tablet', 'mobile'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPreviewMode(mode)}
                        style={{
                          flex: 1, padding: '0.4rem', fontSize: '0.75rem', textTransform: 'capitalize',
                          background: previewMode === mode ? 'var(--primary)' : 'var(--bg-base)',
                          color: previewMode === mode ? '#fff' : 'var(--text-primary)',
                          border: '1px solid ' + (previewMode === mode ? 'var(--primary)' : 'var(--border-light)'),
                          borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        {mode === 'desktop' ? '🖥️ Desktop' : mode === 'tablet' ? '📟 Tablet' : '📱 Mobile'}
                      </button>
                    ))}
                  </div>

                  {/* Live Simulator Viewport */}
                  <div style={{
                    width: '100%',
                    height: '420px',
                    background: '#15151a',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    border: '1px solid var(--border-light)',
                    position: 'relative'
                  }}>
                    {iframeUrl ? (
                      <iframe 
                        ref={iframeRef}
                        src={iframeUrl} 
                        style={{
                          width: previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px',
                          height: '100%',
                          background: '#fff',
                          border: 'none',
                          transition: 'width 0.3s ease-out'
                        }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', height: '100%', fontSize: '0.85rem' }}>
                        No connected website found.
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
                    💡 Tip: Clicking "Save & Publish" auto-reloads this frame instantly via WebSockets!
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <WebsiteAssignmentTab moduleKey="builder" />
      )}
    </div>
  );
}