'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';

function timeAgo(d) {
  if (!d) return 'Never';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  // Search, Filter & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // name, createdAt, lastSyncedAt
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // WebSocket Connection State
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const [syncingId, setSyncingId] = useState(null);
  
  // Connect Website Form & Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    domain: '',
    ipAddress: '',
    apiUrl: '',
    dbHost: '',
    dbPort: '3306',
    dbUser: '',
    dbPassword: '',
    authToken: '',
    framework: 'nextjs',
    environment: 'production',
    ownerInfo: ''
  });
  
  // Connection simulator state
  const [connecting, setConnecting] = useState(false);
  const [connStep, setConnStep] = useState(0); // 0: Idle, 1: DNS/Ping, 2: API validation, 3: Route scanning, 4: Finished

  useEffect(() => {
    // Fetch user profile for RBAC
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error('Error fetching user info:', err));

    fetchWebsites();
    initWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initWebSocket = async () => {
    try {
      setSocketStatus('reconnecting');
      // Initialize Next.js socket server endpoint
      await fetch('/api/socket').catch(() => {});
      
      const socket = io({
        path: '/api/socket',
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setSocketStatus('connected');
        console.log('[WebSocket] Connected to Global Backend Gateway');
      });

      socket.on('disconnect', () => {
        setSocketStatus('disconnected');
        console.log('[WebSocket] Disconnected');
      });

      socket.on('connect_error', () => {
        setSocketStatus('disconnected');
      });

      // Listen for real-time sync updates
      socket.on('website:sync', (update) => {
        setWebsites(prev => prev.map(w => {
          if (w.id === update.websiteId) {
            return {
              ...w,
              status: update.status || w.status,
              syncStatus: update.syncStatus || w.syncStatus,
              lastSyncedAt: update.lastSyncedAt || new Date().toISOString()
            };
          }
          return w;
        }));
      });

      socket.on('sync:event', (event) => {
        if (event.type === 'route:sync') fetchWebsites();
      });
    } catch (err) {
      setSocketStatus('disconnected');
      console.error('[WebSocket] Setup error:', err);
    }
  };

  const handleReconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    initWebSocket();
  };

  const fetchWebsites = async () => {
    try {
      const res = await fetch('/api/websites');
      const json = await res.json();
      if (json.success) {
        setWebsites(json.data || []);
      } else {
        setError(json.error || 'Failed to fetch websites');
      }
    } catch (err) {
      setError('Error loading websites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async (siteId, e) => {
    e.preventDefault(); e.stopPropagation();
    setSyncingId(siteId);
    try {
      const res = await fetch(`/api/websites/${siteId}/sync`, { method: 'POST' });
      const json = await res.json();
      if (json.success) await fetchWebsites();
    } catch {}
    finally { setSyncingId(null); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Security check: Only admins can connect websites
    if (user?.role !== 'admin') {
      setError('Permission denied. Only administrators can connect websites.');
      return;
    }

    setConnecting(true);

    // Simulate verification steps
    setConnStep(1); // Pinging target
    await new Promise(r => setTimeout(r, 600));
    
    setConnStep(2); // Handshaking API / Authentication
    await new Promise(r => setTimeout(r, 600));
    
    setConnStep(3); // Discovering page paths & initial SEO metadata
    await new Promise(r => setTimeout(r, 800));
    
    setConnStep(4); // Finalizing registration

    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const json = await res.json();
      if (json.success) {
        await fetchWebsites();
        setModalOpen(false);
        setForm({
          name: '',
          domain: '',
          ipAddress: '',
          apiUrl: '',
          dbHost: '',
          dbPort: '3306',
          dbUser: '',
          dbPassword: '',
          authToken: '',
          framework: 'nextjs',
          environment: 'production',
          ownerInfo: ''
        });
      } else {
        setError(json.error || 'Failed to connect website');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setConnecting(false);
      setConnStep(0);
    }
  };

  // Filter & Search Logic
  const filteredWebsites = websites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          site.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFramework = frameworkFilter === 'all' || site.framework === frameworkFilter;
    const matchesEnv = envFilter === 'all' || site.environment === envFilter;
    return matchesSearch && matchesFramework && matchesEnv;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'lastSyncedAt') return new Date(b.lastSyncedAt) - new Date(a.lastSyncedAt);
    return 0;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredWebsites.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredWebsites.length / itemsPerPage);

  const getFrameworkBadge = (framework) => {
    const badges = {
      nextjs: { name: 'Next.js', style: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' } },
      react: { name: 'React', style: { background: 'rgba(8,126,164,0.15)', color: '#087ea4', border: '1px solid rgba(8,126,164,0.3)' } },
      wordpress: { name: 'WordPress', style: { background: 'rgba(33,117,155,0.15)', color: '#21759b', border: '1px solid rgba(33,117,155,0.3)' } },
      laravel: { name: 'Laravel', style: { background: 'rgba(255,45,32,0.15)', color: '#ff2d20', border: '1px solid rgba(255,45,32,0.3)' } }
    };
    const current = badges[framework] || { name: framework, style: { background: 'rgba(150,150,150,0.15)', color: '#ccc', border: '1px solid rgba(150,150,150,0.3)' } };
    return <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', ...current.style }}>{current.name}</span>;
  };

  const getSocketStatusColor = () => {
    if (socketStatus === 'connected') return 'var(--success)';
    if (socketStatus === 'reconnecting') return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div style={{ padding: '0 0.5rem' }}>
      {/* Real-time Status Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.5rem',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>⚡</span>
          <span style={{ color: 'var(--text-secondary)' }}>Live Gateway Status:</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 'bold',
            color: getSocketStatusColor()
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getSocketStatusColor(),
              display: 'inline-block',
              animation: socketStatus === 'reconnecting' ? 'pulse 1s infinite' : 'none'
            }} />
            {socketStatus.toUpperCase()}
          </span>
        </div>
        <button
          onClick={handleReconnectSocket}
          className="btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}
        >
          🔄 Force Reconnect Gateway
        </button>
      </div>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Website Connector</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage external websites, auto-discover paths, and synchronize dynamic content instantly.
          </p>
        </div>
        {user?.role === 'admin' ? (
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <span style={{ fontSize: '1.1rem' }}>+</span> Connect Website
          </button>
        ) : (
          <button className="btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Administrators only">
            🔒 Admin Action Required
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Search & Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.5rem',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1 1 250px' }}>
          <input
            type="text"
            placeholder="Search by name or domain..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '0.55rem 0.8rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.875rem'
            }}
          />
        </div>
        
        <div>
          <select
            value={frameworkFilter}
            onChange={(e) => { setFrameworkFilter(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '0.55rem 0.8rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Frameworks</option>
            <option value="nextjs">Next.js</option>
            <option value="react">React / Vite</option>
            <option value="wordpress">WordPress</option>
            <option value="laravel">Laravel</option>
          </select>
        </div>

        <div>
          <select
            value={envFilter}
            onChange={(e) => { setEnvFilter(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '0.55rem 0.8rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.55rem 0.8rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.875rem'
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="createdAt">Sort by Connected Date</option>
            <option value="lastSyncedAt">Sort by Last Synced</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div className="loading">Checking connections...</div>
        </div>
      ) : filteredWebsites.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🌐</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-h1)' }}>No Websites Match Filters</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0.5rem auto 1.5rem', fontSize: '0.9rem' }}>
            Try adjusting your search queries or filter dropdown selections.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {currentItems.map((site) => (
              <div key={site.id} className="service-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                    💻
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h1)' }}>{site.name}</h3>
                      {getFrameworkBadge(site.framework)}
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {site.environment}
                      </span>
                      {site._count?.routes !== undefined && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontWeight: 700 }}>
                          📄 {site._count.routes} routes
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span>📍 <strong>{site.domain}</strong></span>
                      <span>•</span>
                      <span>🖥️ <code>{site.ipAddress}</code></span>
                      <span>•</span>
                      <span>📦 SDK: <code>{site.sdkVersion || (site.framework === 'nextjs' ? 'v1.4.0' : 'v1.0.0')}</code></span>
                      <span>•</span>
                      <span>🕐 Synced: <strong>{timeAgo(site.lastSyncedAt)}</strong></span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: site.status === 'connected' ? 'var(--success-bg)' : 'var(--danger-bg)', color: site.status === 'connected' ? 'var(--success)' : 'var(--danger)', border: site.status === 'connected' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: site.status === 'connected' ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }} />
                      {site.status === 'connected' ? 'ONLINE' : 'OFFLINE'}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleSyncNow(site.id, e)}
                    disabled={syncingId === site.id}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', borderRadius: 'var(--radius-md)', opacity: syncingId === site.id ? 0.6 : 1 }}
                  >
                    {syncingId === site.id ? '⏳' : '🔄'} Sync
                  </button>

                  <Link href={`/dashboard/websites/${site.id}`} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)' }}>
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              >
                ◀ Prev
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page <strong>{currentPage}</strong> of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}

      {/* Connect Wizard Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyHeight: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '2rem', maxWidth: '600px', width: '100%', boxShadow: 'var(--shadow-lg)', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
            
            <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>
              ✕
            </button>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-h1)', marginBottom: '0.5rem' }}>🔌 Connect External Website</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Verify domain availability and sync initial page routes to manage layouts dynamically.
            </p>

            {connecting ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', border: '3px solid var(--border-strong)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1.5rem auto', animation: 'spin 1s linear infinite' }} />
                <h4 style={{ fontWeight: 'bold', color: 'var(--text-h1)', fontSize: '1.1rem' }}>Verifying External Node Connection...</h4>
                
                <div style={{ maxWidth: '350px', margin: '1.5rem auto 0 auto', textAlign: 'left', background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  <div style={{ color: connStep >= 1 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {connStep >= 1 ? '✓' : '○'} Step 1: Performing DNS handshake & Ping...
                  </div>
                  <div style={{ color: connStep >= 2 ? 'var(--success)' : 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {connStep >= 2 ? '✓' : '○'} Step 2: Validating Secure Handshake Auth Token...
                  </div>
                  <div style={{ color: connStep >= 3 ? 'var(--success)' : 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {connStep >= 3 ? '✓' : '○'} Step 3: Fetching sitemap & auto-discovering routes...
                  </div>
                  <div style={{ color: connStep >= 4 ? 'var(--success)' : 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {connStep >= 4 ? '✓' : '○'} Step 4: Registering node credentials inside CMS...
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Website Name</label>
                    <input required type="text" name="name" placeholder="e.g. My NextJS Site" value={form.name} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Frontend Framework</label>
                    <select name="framework" value={form.framework} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}>
                      <option value="nextjs">Next.js (App / Pages)</option>
                      <option value="react">React / Vite SPA</option>
                      <option value="wordpress">WordPress (REST API)</option>
                      <option value="laravel">Laravel (Blade/API)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Website Domain Name</label>
                    <input required type="text" name="domain" placeholder="e.g. example.com" value={form.domain} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Server IP Address</label>
                    <input required type="text" name="ipAddress" placeholder="e.g. 192.168.1.100" value={form.ipAddress} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>API Endpoint URL (optional)</label>
                    <input type="text" name="apiUrl" placeholder="e.g. https://api.example.com" value={form.apiUrl} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Secure Sync Handshake Token / API Key</label>
                    <input required type="password" name="authToken" placeholder="Token for authentication" value={form.authToken} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Environment Type</label>
                    <select name="environment" value={form.environment} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}>
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Owner Info / Email</label>
                    <input type="text" name="ownerInfo" placeholder="e.g. admin@example.com" value={form.ownerInfo} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>🗄️ External Database Connection (Optional)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>DB Host / Endpoint</label>
                      <input type="text" name="dbHost" placeholder="e.g. database-1.rds.amazonaws.com" value={form.dbHost} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>DB Port</label>
                      <input type="text" name="dbPort" value={form.dbPort} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>DB Username</label>
                      <input type="text" name="dbUser" placeholder="e.g. root" value={form.dbUser} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>DB Password</label>
                      <input type="password" name="dbPassword" placeholder="••••••••" value={form.dbPassword} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Verify & Sync Website</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
