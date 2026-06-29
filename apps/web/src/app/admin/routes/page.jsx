'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const MODULES = {
  cms:       { label: 'CMS',       color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: '📄' },
  blog:      { label: 'Blog',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: '📝' },
  seo:       { label: 'SEO',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  icon: '🔍' },
  forms:     { label: 'Forms',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '📋' },
  legal:     { label: 'Legal',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '⚖️' },
  analytics: { label: 'Analytics', color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',  icon: '📊' },
  media:     { label: 'Media',     color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  icon: '🖼️' },
  settings:  { label: 'Settings',  color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: '⚙️' },
};

const ROUTE_TYPE_COLORS = {
  api:     { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', label: 'API' },
  dynamic: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Dynamic' },
  page:    { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Page' },
};

function ModuleBadge({ module }) {
  if (!module) return <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>—</span>;
  const m = MODULES[module] || { label: module, color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '📦' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
      background: m.bg, color: m.color, border: `1px solid ${m.color}44`
    }}>
      {m.icon} {m.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = ROUTE_TYPE_COLORS[type] || ROUTE_TYPE_COLORS.page;
  return (
    <span style={{
      padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
      background: t.bg, color: t.color, border: `1px solid ${t.color}44`
    }}>{t.label}</span>
  );
}

export default function RouteManagementPage() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [savingRouteId, setSavingRouteId] = useState(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState(new Set());
  const [syncingWebsite, setSyncingWebsite] = useState(false);
  const socketRef = useRef(null);

  // Edit modal
  const [editingRoute, setEditingRoute] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', path: '', metaTitle: '', metaDescription: '',
    keywords: '', canonical: '', ogImage: '', status: 'active'
  });

  useEffect(() => {
    fetchWebsites();
    initSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useEffect(() => {
    if (selectedWebsiteId) fetchRoutes(selectedWebsiteId);
    else setRoutes([]);
  }, [selectedWebsiteId]);

  const initSocket = async () => {
    try {
      await fetch('/api/socket').catch(() => {});
      const socket = io({ path: '/api/socket', reconnectionDelay: 2000 });
      socketRef.current = socket;
      socket.on('connect', () => {
        setSocketStatus('connected');
        socket.emit('join-website', 'monitor');
      });
      socket.on('disconnect', () => setSocketStatus('disconnected'));
      socket.on('connect_error', () => setSocketStatus('disconnected'));

      socket.on('route:module-update', (data) => {
        setRoutes(prev => prev.map(r =>
          r.id === data.routeId ? { ...r, assignedModule: data.module } : r
        ));
        markRecentlyUpdated(data.routeId);
      });

      socket.on('route:update', (data) => {
        setRoutes(prev => prev.map(r => r.id === data.id ? { ...r, ...data } : r));
        markRecentlyUpdated(data.id);
      });

      socket.on('website:sync', (data) => {
        if (data.type === 'route:sync' && data.websiteId === selectedWebsiteId) {
          fetchRoutes(selectedWebsiteId);
        }
      });
    } catch { setSocketStatus('disconnected'); }
  };

  const markRecentlyUpdated = (id) => {
    setRecentlyUpdated(prev => new Set([...prev, id]));
    setTimeout(() => {
      setRecentlyUpdated(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 4000);
  };

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/websites');
      const json = await res.json();
      if (json.success) {
        setWebsites(json.data || []);
        if (json.data?.length > 0) setSelectedWebsiteId(json.data[0].id);
      } else setError(json.error || 'Failed to load websites');
    } catch { setError('Error loading websites.'); }
    finally { setLoading(false); }
  };

  const fetchRoutes = async (websiteId) => {
    try {
      setRoutesLoading(true);
      const res = await fetch(`/api/routes/${websiteId}`);
      const json = await res.json();
      if (json.success) setRoutes(json.data || []);
      else setError(json.error || 'Failed to fetch routes');
    } catch { setError('Error loading routes.'); }
    finally { setRoutesLoading(false); }
  };

  const handleAssignModule = async (routeId, module) => {
    setSavingRouteId(routeId);
    try {
      const res = await fetch(`/api/routes/${routeId}/module`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: module || null })
      });
      const json = await res.json();
      if (json.success) {
        setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, assignedModule: module || null } : r));
        markRecentlyUpdated(routeId);
      } else alert(json.error || 'Failed to assign module');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSavingRouteId(null); }
  };

  const handleForceSyncWebsite = async () => {
    if (!selectedWebsiteId) return;
    try {
      setSyncingWebsite(true);
      const res = await fetch(`/api/websites/${selectedWebsiteId}/sync`, { method: 'POST' });
      const json = await res.json();
      if (json.success) await fetchRoutes(selectedWebsiteId);
      else alert(json.error || 'Sync failed');
    } catch (err) { alert('Sync error: ' + err.message); }
    finally { setSyncingWebsite(false); }
  };

  const handleEditClick = (route) => {
    setEditingRoute(route);
    setFormData({
      title: route.title || '', path: route.path || '',
      metaTitle: route.metaTitle || '', metaDescription: route.metaDescription || '',
      keywords: route.keywords || '', canonical: route.canonical || '',
      ogImage: route.ogImage || '', status: route.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!editingRoute) return;
    try {
      setRoutesLoading(true);
      const res = await fetch(`/api/routes/${editingRoute.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) { setShowEditModal(false); await fetchRoutes(selectedWebsiteId); }
      else alert(json.error || 'Failed to update route');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setRoutesLoading(false); }
  };

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);
  const filteredRoutes = routes.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = r.path.toLowerCase().includes(q) || (r.title?.toLowerCase().includes(q));
    const matchType = typeFilter === 'all' || (r.routeType || 'page') === typeFilter;
    const matchModule = moduleFilter === 'all' || r.assignedModule === moduleFilter || (moduleFilter === 'none' && !r.assignedModule);
    return matchSearch && matchType && matchModule;
  });

  const stats = {
    total: routes.length,
    mapped: routes.filter(r => r.assignedModule).length,
    unmapped: routes.filter(r => !r.assignedModule).length,
    pages: routes.filter(r => (r.routeType || 'page') === 'page').length,
    apis: routes.filter(r => r.routeType === 'api').length,
    dynamic: routes.filter(r => r.isDynamic).length,
  };

  const inp = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem' };
  const sel = { ...inp, width: 'auto' };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-base)', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Route Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Assign backend modules to frontend routes. The SDK auto-delivers data for each connected feature.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: socketStatus === 'connected' ? '#10b981' : '#6b7280' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: socketStatus === 'connected' ? '#10b981' : '#6b7280', display: 'inline-block' }} />
            {socketStatus === 'connected' ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          ⚠️ {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '0.5rem' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading connected sites...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
          {/* Sidebar */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: 'fit-content' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected Sites</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {websites.map(site => (
                <button key={site.id} onClick={() => setSelectedWebsiteId(site.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                  background: selectedWebsiteId === site.id ? 'var(--primary-light)' : 'transparent',
                  color: selectedWebsiteId === site.id ? 'var(--primary)' : 'var(--text-primary)',
                  border: '1px solid ' + (selectedWebsiteId === site.id ? 'var(--primary)' : 'var(--border-light)'),
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.875rem',
                  fontWeight: selectedWebsiteId === site.id ? 700 : 400, transition: 'all 0.15s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{site.name}</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'var(--bg-base)', border: '1px solid var(--border-light)', borderRadius: '3px', fontFamily: 'monospace' }}>
                      {site.framework}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{site.domain}</div>
                </button>
              ))}
              {websites.length === 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No connected websites.</div>
              )}
            </div>

            {/* Module legend */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Modules</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {Object.entries(MODULES).map(([key, m]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                    <span>{m.icon} {m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Panel */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            {/* Stats strip */}
            {selectedWebsite && (
              <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span>🌐 <strong>{selectedWebsite.name}</strong></span>
                <span>·</span>
                <span>📦 {stats.total} routes</span>
                <span>·</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>✅ {stats.mapped} mapped</span>
                <span>·</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>⚠️ {stats.unmapped} unmapped</span>
                <span>·</span>
                <span>📄 {stats.pages} pages</span>
                <span>·</span>
                <span>🔀 {stats.dynamic} dynamic</span>
              </div>
            )}

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
                <input type="text" placeholder="Search routes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inp, flex: '1 1 180px', maxWidth: '260px' }} />
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={sel}>
                  <option value="all">All Types</option>
                  <option value="page">Pages</option>
                  <option value="api">API Routes</option>
                  <option value="dynamic">Dynamic</option>
                </select>
                <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={sel}>
                  <option value="all">All Modules</option>
                  <option value="none">Unmapped</option>
                  {Object.entries(MODULES).map(([k, m]) => (
                    <option key={k} value={k}>{m.icon} {m.label}</option>
                  ))}
                </select>
              </div>
              {selectedWebsiteId && (
                <button onClick={handleForceSyncWebsite} disabled={syncingWebsite} className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: syncingWebsite ? 0.7 : 1 }}>
                  {syncingWebsite ? '⏳ Syncing...' : '🔄 Force Sync'}
                </button>
              )}
            </div>

            {routesLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading routes...</div>
            ) : !selectedWebsiteId ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Select a website to view its routes.</div>
            ) : filteredRoutes.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No routes found.<br />
                <span style={{ fontSize: '0.85rem' }}>Install the SDK and call <code>connectAndSync()</code> to discover routes automatically.</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-light)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Route Path</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Connected Feature</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Assign Module</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>SEO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map(route => {
                      const isRecent = recentlyUpdated.has(route.id);
                      const isSaving = savingRouteId === route.id;
                      return (
                        <tr key={route.id} style={{
                          borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem',
                          transition: 'background 0.2s',
                          background: isRecent ? 'rgba(16,185,129,0.04)' : 'transparent'
                        }}>
                          <td style={{ padding: '0.75rem 0.75rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {isRecent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} title="Recently updated" />}
                              {route.path}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem' }}>
                            <TypeBadge type={route.routeType || 'page'} />
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem' }}>
                            <ModuleBadge module={route.assignedModule} />
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <select
                                value={route.assignedModule || ''}
                                onChange={e => handleAssignModule(route.id, e.target.value || null)}
                                disabled={isSaving}
                                style={{
                                  padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-md)',
                                  border: '1px solid var(--border-strong)', background: 'var(--bg-base)',
                                  color: 'var(--text-primary)', fontSize: '0.78rem', cursor: 'pointer',
                                  opacity: isSaving ? 0.6 : 1
                                }}
                              >
                                <option value="">— None —</option>
                                {Object.entries(MODULES).map(([k, m]) => (
                                  <option key={k} value={k}>{m.icon} {m.label}</option>
                                ))}
                              </select>
                              {isSaving && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>saving…</span>}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem' }}>
                            <span style={{
                              padding: '0.2rem 0.5rem', fontSize: '0.72rem', borderRadius: '3px', fontWeight: 700,
                              background: route.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: route.status === 'active' ? '#10b981' : '#ef4444'
                            }}>{route.status?.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>
                            <button onClick={() => handleEditClick(route)} className="btn-secondary"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                              ✏️ Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit SEO Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Edit Route SEO</h3>
                <code style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{editingRoute?.path}</code>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Page Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Meta Title</label>
                <input type="text" value={formData.metaTitle} onChange={e => setFormData(p => ({ ...p, metaTitle: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Meta Description</label>
                <textarea rows={3} value={formData.metaDescription} onChange={e => setFormData(p => ({ ...p, metaDescription: e.target.value }))} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Keywords</label>
                <input type="text" placeholder="e.g. healthcare, clinic" value={formData.keywords} onChange={e => setFormData(p => ({ ...p, keywords: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>OG Image URL</label>
                  <input type="text" value={formData.ogImage} onChange={e => setFormData(p => ({ ...p, ogImage: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Status</label>
                  <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} style={inp}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" style={{ padding: '0.6rem 1.25rem', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.25rem', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}>💾 Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
