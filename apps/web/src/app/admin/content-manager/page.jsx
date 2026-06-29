'use client';

import { useState, useEffect } from 'react';

export default function ContentManagerPage() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Page content editor state
  const [editorContent, setEditorContent] = useState({
    bannerTitle: '',
    bannerSubtitle: '',
    heroTitle: '',
    heroText: '',
    featureTitle: '',
    features: []
  });

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    if (selectedWebsiteId) {
      fetchRoutes(selectedWebsiteId);
    } else {
      setRoutes([]);
      setSelectedRoute(null);
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

  const fetchRoutes = async (websiteId) => {
    try {
      setRoutesLoading(true);
      const res = await fetch(`/api/routes/${websiteId}`);
      const json = await res.json();
      if (json.success) {
        setRoutes(json.data || []);
        if (json.data && json.data.length > 0) {
          handleSelectRoute(json.data[0]);
        } else {
          setSelectedRoute(null);
        }
      }
    } catch (err) {
      setError('Error loading routes.');
    } finally {
      setRoutesLoading(false);
    }
  };

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    
    // Parse content blocks
    let parsed = {
      bannerTitle: '',
      bannerSubtitle: '',
      heroTitle: '',
      heroText: '',
      featureTitle: '',
      features: []
    };

    try {
      if (route.content) {
        const c = typeof route.content === 'string' ? JSON.parse(route.content) : route.content;
        parsed.bannerTitle = c.banner?.title || '';
        parsed.bannerSubtitle = c.banner?.subtitle || '';
        
        const heroSection = c.sections?.find(s => s.type === 'hero');
        parsed.heroTitle = heroSection?.title || '';
        parsed.heroText = heroSection?.text || '';
        
        const featuresSection = c.sections?.find(s => s.type === 'features');
        parsed.featureTitle = featuresSection?.title || '';
        parsed.features = featuresSection?.items || [];
      }
    } catch (e) {
      console.warn('Parsing route content failed:', e);
    }

    setEditorContent(parsed);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditorContent(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!selectedRoute) return;

    // Build the payload
    const updatedContent = {
      banner: {
        title: editorContent.bannerTitle,
        subtitle: editorContent.bannerSubtitle,
        backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60'
      },
      sections: [
        {
          id: 'section-hero',
          type: 'hero',
          title: editorContent.heroTitle,
          text: editorContent.heroText
        },
        {
          id: 'section-features',
          type: 'features',
          title: editorContent.featureTitle,
          items: editorContent.features
        }
      ]
    };

    try {
      setRoutesLoading(true);
      const res = await fetch('/api/content/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: selectedWebsiteId,
          path: selectedRoute.path,
          content: updatedContent
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Content blocks saved and synchronized in real time!');
        await fetchRoutes(selectedWebsiteId);
      } else {
        alert(json.error || 'Failed to update content');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRoutesLoading(false);
    }
  };

  return (
    <div className="content-manager-page" style={{ padding: '1.5rem', background: 'var(--bg-base)', minHeight: '80vh' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Content Block Manager</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Manage page sections, hero text blocks, header banner elements, and FAQs.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading websites...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
          {/* Sidebar selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Website dropdown */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Website Target</label>
              <select
                value={selectedWebsiteId}
                onChange={(e) => setSelectedWebsiteId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
              >
                {websites.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            {/* Route List */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', flex: 1 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--text-h1)' }}>Routes & Pages</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {routesLoading ? (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', padding: '1rem', color: 'var(--text-muted)' }}>Loading...</div>
                ) : routes.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRoute(r)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.6rem 0.8rem',
                      background: selectedRoute?.id === r.id ? 'var(--primary-light)' : 'transparent',
                      color: selectedRoute?.id === r.id ? 'var(--primary)' : 'var(--text-primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: selectedRoute?.id === r.id ? 'bold' : 'normal'
                    }}
                  >
                    {r.path}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor block */}
          {selectedRoute ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-h1)', margin: 0 }}>Content Block Editor</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Editing dynamic blocks for path: {selectedRoute.path}</p>
                </div>
                <button
                  onClick={handleSave}
                  style={{ padding: '0.6rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save & Sync Sockets
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Banner Section */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)', margin: 0 }}>Header Banner Block</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Banner Title</label>
                      <input
                        type="text"
                        name="bannerTitle"
                        value={editorContent.bannerTitle}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Banner Subtitle</label>
                      <input
                        type="text"
                        name="bannerSubtitle"
                        value={editorContent.bannerSubtitle}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Hero Section */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)', margin: 0 }}>Main Hero Block</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Hero Title</label>
                      <input
                        type="text"
                        name="heroTitle"
                        value={editorContent.heroTitle}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Hero Text Block</label>
                      <textarea
                        name="heroText"
                        rows="4"
                        value={editorContent.heroText}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Block */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)', margin: 0 }}>Features Block</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Features Section Title</label>
                      <input
                        type="text"
                        name="featureTitle"
                        value={editorContent.featureTitle}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a route/page from the left column to begin content block editing.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
