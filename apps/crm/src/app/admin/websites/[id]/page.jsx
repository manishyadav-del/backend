'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';

export default function WebsiteDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [activeTab, setActiveTab] = useState('overview'); // overview, routes, editor, apis, modules, logs
  const [website, setWebsite] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [apis, setApis] = useState([]);
  const [modules, setModules] = useState({
    dashboard: true,
    users: true,
    roles: true,
    crm: false,
    projects: false,
    tasks: false,
    reports: false,
    notifications: true,
    settings: true,
    customModules: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [scanningApis, setScanningApis] = useState(false);
  const [syncingModules, setSyncingModules] = useState(false);
  const [user, setUser] = useState(null);

  // Show/Hide token state
  const [showToken, setShowToken] = useState(false);
  
  // WebSocket Connection State
  const [socketStatus, setSocketStatus] = useState('disconnected'); // connected, disconnected, reconnecting
  const socketRef = useRef(null);

  // Search & Pagination for Routes
  const [routeSearch, setRouteSearch] = useState('');
  const [routePage, setRoutePage] = useState(1);
  const [routesPerPage] = useState(5);

  // Forms and actions state
  const [editForm, setEditForm] = useState({
    name: '',
    domain: '',
    ipAddress: '',
    apiUrl: '',
    dbHost: '',
    dbPort: '3306',
    dbUser: '',
    dbPassword: '',
    authToken: '',
    framework: '',
    status: '',
    environment: 'production',
    ownerInfo: ''
  });

  // Route Form State (Adding new route)
  const [routeFormOpen, setRouteFormOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({
    path: '',
    title: '',
    metaTitle: '',
    metaDescription: '',
    type: 'page',
    status: 'active',
    associatedModules: ''
  });

  // Route Settings Edit Modal State
  const [editRouteModalOpen, setEditRouteModalOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState(null);
  const [routeEditForm, setRouteEditForm] = useState({
    title: '',
    path: '',
    metaTitle: '',
    metaDescription: '',
    status: 'active',
    type: 'page',
    associatedModules: ''
  });

  // Content Editor State
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [editorContent, setEditorContent] = useState({
    title: '',
    metaTitle: '',
    metaDescription: '',
    bannerTitle: '',
    bannerSubtitle: '',
    sections: [],
    type: 'page',
    associatedModules: ''
  });

  useEffect(() => {
    // Fetch user for RBAC
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error('Error fetching user info:', err));

    if (id) {
      fetchDetails();
      fetchRoutes();
      fetchLogs();
      fetchApis();
      fetchModules();
      initWebSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const initWebSocket = async () => {
    try {
      setSocketStatus('reconnecting');
      await fetch('/api/socket').catch(() => {});
      
      const socket = io({
        path: '/api/socket',
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setSocketStatus('connected');
        console.log('[WebSocket] Connected, joining website room:', id);
        socket.emit('join-website', id);
      });

      socket.on('disconnect', () => {
        setSocketStatus('disconnected');
      });

      socket.on('connect_error', () => {
        setSocketStatus('disconnected');
      });

      // Real-time synchronization events
      socket.on('route:updated', (data) => {
        console.log('[WebSocket] Route updated:', data);
        fetchRoutes();
        fetchLogs();
      });

      socket.on('route:created', (data) => {
        console.log('[WebSocket] Route created:', data);
        fetchRoutes();
        fetchLogs();
      });

      socket.on('route:deleted', (data) => {
        console.log('[WebSocket] Route deleted:', data);
        fetchRoutes();
        fetchLogs();
      });

      socket.on('joined', (data) => {
        console.log('[WebSocket] Room join confirmation:', data);
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

  const fetchApis = async () => {
    try {
      const res = await fetch(`/api/websites/${id}/apis`);
      const json = await res.json();
      if (json.success) setApis(json.data);
    } catch (err) {
      console.error('Error fetching APIs:', err);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(`/api/websites/${id}/modules`);
      const json = await res.json();
      if (json.success) setModules(json.data);
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  };

  const handleScanApis = async () => {
    if (user?.role !== 'admin') {
      setError('Permission denied. Administrators only.');
      return;
    }
    setScanningApis(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/websites/${id}/apis`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setApis(json.data);
        setMessage('API Discovery scan complete. Discovered ' + json.data.length + ' endpoints.');
        fetchLogs();
      } else {
        setError(json.error || 'API scan failed');
      }
    } catch (err) {
      setError('Error scanning APIs.');
    } finally {
      setScanningApis(false);
    }
  };

  const handleToggleModule = (key) => {
    if (user?.role !== 'admin') return;
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSyncModules = async () => {
    if (user?.role !== 'admin') {
      setError('Permission denied. Administrators only.');
      return;
    }
    setSyncingModules(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/websites/${id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules })
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Module configurations successfully updated and synchronized to external agent.');
        fetchLogs();
      } else {
        setError(json.error || 'Failed to sync modules');
      }
    } catch (err) {
      setError('Error synchronizing modules.');
    } finally {
      setSyncingModules(false);
    }
  };

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/websites/${id}`);
      const json = await res.json();
      if (json.success) {
        setWebsite(json.data);
        setEditForm({
          name: json.data.name,
          domain: json.data.domain,
          ipAddress: json.data.ipAddress,
          apiUrl: json.data.apiUrl || '',
          dbHost: json.data.dbHost || '',
          dbPort: json.data.dbPort?.toString() || '3306',
          dbUser: json.data.dbUser || '',
          dbPassword: json.data.dbPassword || '',
          authToken: json.data.authToken || '',
          framework: json.data.framework,
          status: json.data.status,
          environment: json.data.environment || 'production',
          ownerInfo: json.data.ownerInfo || ''
        });
      } else {
        setError(json.error || 'Failed to load details');
      }
    } catch (err) {
      setError('Error loading website configuration.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`/api/websites/${id}/routes`);
      const json = await res.json();
      if (json.success) {
        setRoutes(json.data);
        if (json.data.length > 0 && !selectedRoute) {
          handleSelectRouteForEditor(json.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/websites/${id}/logs`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (user?.role !== 'admin') {
      setError('Permission denied. Only administrators can edit website settings.');
      return;
    }
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/websites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Website configurations updated successfully.');
        fetchDetails();
        fetchLogs();
      } else {
        setError(json.error || 'Failed to update settings');
      }
    } catch (err) {
      setError('Connection error updating settings.');
    }
  };

  const handleDeleteWebsite = async () => {
    if (user?.role !== 'admin') {
      setError('Permission denied. Only administrators can disconnect websites.');
      return;
    }
    if (!confirm('Are you sure you want to disconnect this website? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/websites/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        router.push('/admin/websites');
      } else {
        setError(json.error || 'Failed to disconnect website');
      }
    } catch (err) {
      setError('Connection error removing website connection.');
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/websites/${id}/sync`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setMessage('Website routes metadata and connection synchronized successfully.');
        fetchDetails();
        fetchRoutes();
        fetchLogs();
      } else {
        setError(json.error || 'Sync failed');
      }
    } catch (err) {
      setError('Connection error performing manual sync.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (user?.role !== 'admin') {
      setError('Permission denied. Only administrators can add routes.');
      return;
    }
    setError('');
    
    // Save associatedModules inside route content JSON
    const contentPayload = JSON.stringify({
      banner: { title: newRoute.title, subtitle: `Dynamic ${newRoute.title} section` },
      sections: [{ id: 'section-1', type: 'hero', title: newRoute.title, text: `Dynamic content for ${newRoute.path}` }],
      type: newRoute.type || 'page',
      associatedModules: newRoute.associatedModules ? newRoute.associatedModules.split(',').map(m => m.trim()) : []
    });

    try {
      const res = await fetch(`/api/websites/${id}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRoute,
          content: contentPayload
        })
      });
      const json = await res.json();
      if (json.success) {
        setRouteFormOpen(false);
        setNewRoute({ path: '', title: '', metaTitle: '', metaDescription: '', type: 'page', status: 'active', associatedModules: '' });
        fetchRoutes();
        fetchLogs();
      } else {
        setError(json.error || 'Failed to create route');
      }
    } catch (err) {
      setError('Error creating route.');
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (user?.role !== 'admin') {
      setError('Permission denied. Only administrators can delete routes.');
      return;
    }
    if (!confirm('Are you sure you want to delete this route? This will be synchronized with the frontend immediately.')) {
      return;
    }
    setError('');
    try {
      const res = await fetch(`/api/websites/${id}/routes?routeId=${routeId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        fetchRoutes();
        fetchLogs();
      } else {
        setError(json.error || 'Failed to delete route');
      }
    } catch (err) {
      setError('Error deleting route.');
    }
  };

  const handleSelectRouteForEditor = (route) => {
    setSelectedRoute(route);
    let parsed = { banner: { title: '', subtitle: '' }, sections: [], type: 'page', associatedModules: [] };
    try {
      parsed = JSON.parse(route.content);
    } catch (e) {}

    setEditorContent({
      title: route.title,
      metaTitle: route.metaTitle || '',
      metaDescription: route.metaDescription || '',
      bannerTitle: parsed.banner?.title || '',
      bannerSubtitle: parsed.banner?.subtitle || '',
      sections: parsed.sections || [],
      type: parsed.type || 'page',
      associatedModules: parsed.associatedModules ? parsed.associatedModules.join(', ') : ''
    });
  };

  const handleEditorSectionChange = (index, field, value) => {
    setEditorContent(prev => {
      const updated = [...prev.sections];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, sections: updated };
    });
  };

  const handleAddEditorSection = () => {
    setEditorContent(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: `section-${Date.now()}`, type: 'hero', title: 'New Content Block', text: 'Edit section text content...' }
      ]
    }));
  };

  const handleRemoveEditorSection = (index) => {
    setEditorContent(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const handleSaveContent = async () => {
    if (user?.role !== 'admin') {
      setError('Permission denied. Only administrators can save content changes.');
      return;
    }
    setError('');
    setMessage('');
    try {
      const fullContent = {
        banner: {
          title: editorContent.bannerTitle,
          subtitle: editorContent.bannerSubtitle
        },
        sections: editorContent.sections,
        type: editorContent.type || 'page',
        associatedModules: editorContent.associatedModules ? editorContent.associatedModules.split(',').map(m => m.trim()) : []
      };

      const res = await fetch(`/api/websites/${id}/routes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: selectedRoute.id,
          title: editorContent.title,
          metaTitle: editorContent.metaTitle,
          metaDescription: editorContent.metaDescription,
          content: JSON.stringify(fullContent)
        })
      });

      const json = await res.json();
      if (json.success) {
        setMessage(`Content for route ${selectedRoute.path} updated & pushed to frontend successfully!`);
        fetchRoutes();
        fetchLogs();
      } else {
        setError(json.error || 'Failed to save content changes');
      }
    } catch (err) {
      setError('Connection error pushing content updates.');
    }
  };

  const handleOpenEditRouteSettings = (route) => {
    let parsed = { type: 'page', associatedModules: [] };
    try {
      parsed = JSON.parse(route.content);
    } catch (e) {}

    setRouteToEdit(route);
    setRouteEditForm({
      title: route.title,
      path: route.path,
      metaTitle: route.metaTitle || '',
      metaDescription: route.metaDescription || '',
      status: route.status || 'active',
      type: parsed.type || 'page',
      associatedModules: parsed.associatedModules ? parsed.associatedModules.join(', ') : ''
    });
    setEditRouteModalOpen(true);
  };

  const handleSaveRouteSettings = async (e) => {
    e.preventDefault();
    if (user?.role !== 'admin') {
      setError('Permission denied. Only administrators can update route settings.');
      return;
    }
    setError('');
    try {
      let parsedContent = { banner: { title: '', subtitle: '' }, sections: [] };
      try {
        parsedContent = JSON.parse(routeToEdit.content);
      } catch (e) {}

      const updatedContent = JSON.stringify({
        ...parsedContent,
        type: routeEditForm.type,
        associatedModules: routeEditForm.associatedModules ? routeEditForm.associatedModules.split(',').map(m => m.trim()) : []
      });

      const res = await fetch(`/api/websites/${id}/routes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: routeToEdit.id,
          path: routeEditForm.path,
          title: routeEditForm.title,
          metaTitle: routeEditForm.metaTitle,
          metaDescription: routeEditForm.metaDescription,
          status: routeEditForm.status,
          content: updatedContent
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditRouteModalOpen(false);
        fetchRoutes();
        fetchLogs();
        setMessage('Route settings updated and synchronized successfully.');
      } else {
        setError(json.error || 'Failed to update route settings');
      }
    } catch (err) {
      setError('Connection error updating route settings.');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setMessage(`${label} copied to clipboard!`);
    setTimeout(() => setMessage(''), 3000);
  };

  // Filter Routes by path search
  const filteredRoutes = routes.filter(r => r.path.toLowerCase().includes(routeSearch.toLowerCase()));
  const totalRoutePages = Math.ceil(filteredRoutes.length / routesPerPage);
  const indexOfLastRoute = routePage * routesPerPage;
  const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
  const currentRoutes = filteredRoutes.slice(indexOfFirstRoute, indexOfLastRoute);

  const getRouteTypeAndModules = (route) => {
    let parsed = { type: 'page', associatedModules: [] };
    try {
      parsed = JSON.parse(route.content);
    } catch (e) {}
    
    // Automatically deduce API type if path starts with /api
    const resolvedType = route.path.startsWith('/api') ? 'API' : (parsed.type || 'page');
    return {
      type: resolvedType,
      modules: parsed.associatedModules || []
    };
  };

  if (loading) {
    return <div className="loading" style={{ textAlign: 'center', padding: '4rem' }}>Loading website details...</div>;
  }

  if (!website) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Website Not Found</h2>
        <Link href="/admin/websites" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to Connections</Link>
      </div>
    );
  }

  const isReadOnly = user?.role !== 'admin';

  return (
    <div>
      {/* Back breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link href="/admin/websites" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>← Back to Websites</Link>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          background: socketStatus === 'connected' ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: socketStatus === 'connected' ? 'var(--success)' : 'var(--danger)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: socketStatus === 'connected' ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }} />
          GATEWAY: {socketStatus.toUpperCase()}
        </span>
      </div>

      {/* View Only Banner */}
      {isReadOnly && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          color: 'var(--warning)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🔒 <strong>View Only Mode:</strong> You do not have administrator permissions. All modifications and configurations are disabled.
        </div>
      )}

      {/* Title section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>{website.name}</h1>
            <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              {website.framework.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {website.environment}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
            Domain: <strong style={{ color: 'var(--text-primary)' }}>{website.domain}</strong> • IP Address: <code>{website.ipAddress}</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={handleManualSync} disabled={syncing} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {syncing ? 'Syncing...' : '🔄 Manual Sync'}
          </button>
          {!isReadOnly && (
            <button className="btn-secondary btn-danger" onClick={handleDeleteWebsite}>
              Disconnect Website
            </button>
          )}
        </div>
      </div>

      {/* Website ID & Token Panel */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>Website ID</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <code style={{ fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-base)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>{website.id}</code>
            <button onClick={() => copyToClipboard(website.id, 'Website ID')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Copy ID">📋</button>
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>Secure API Token</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type={showToken ? 'text' : 'password'}
              readOnly
              value={website.authToken || ''}
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-base)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid var(--border-light)',
                width: '260px',
                fontFamily: 'monospace',
                outline: 'none'
              }}
            />
            <button onClick={() => setShowToken(!showToken)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} title={showToken ? 'Hide token' : 'Show token'}>
              {showToken ? '👁️' : '👁️‍🗨️'}
            </button>
            <button onClick={() => copyToClipboard(website.authToken || '', 'API Token')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }} title="Copy Token">📋</button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}
      {message && <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>✓ {message}</div>}

      {/* Tab navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem', gap: '1.5rem' }}>
        {['overview', 'routes', 'editor', 'apis', 'modules', 'logs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.75rem 0.25rem',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'var(--transition)'
            }}
          >
            {tab === 'apis' ? 'API Manager' : tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW & SETTINGS */}
      {activeTab === 'overview' && (
        <div className="dashboard-grid">
          <div className="col-8">
            <div className="chart-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-h1)' }}>Update Credentials & Sync Parameters</h3>
              <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Connection Name</label>
                    <input disabled={isReadOnly} type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Framework Node</label>
                    <select disabled={isReadOnly} value={editForm.framework} onChange={(e) => setEditForm({ ...editForm, framework: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}>
                      <option value="nextjs">Next.js</option>
                      <option value="react">React / Vite</option>
                      <option value="wordpress">WordPress REST</option>
                      <option value="laravel">Laravel</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Domain</label>
                    <input disabled={isReadOnly} type="text" value={editForm.domain} onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Server IP Address</label>
                    <input disabled={isReadOnly} type="text" value={editForm.ipAddress} onChange={(e) => setEditForm({ ...editForm, ipAddress: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>API Sync URL</label>
                    <input disabled={isReadOnly} type="text" value={editForm.apiUrl} onChange={(e) => setEditForm({ ...editForm, apiUrl: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Auth Secret Token (API Key)</label>
                    <input disabled={isReadOnly} type="password" placeholder="Change Authentication Token" value={editForm.authToken} onChange={(e) => setEditForm({ ...editForm, authToken: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Environment Type</label>
                    <select disabled={isReadOnly} value={editForm.environment} onChange={(e) => setEditForm({ ...editForm, environment: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}>
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Owner Info / Email</label>
                    <input disabled={isReadOnly} type="text" value={editForm.ownerInfo} onChange={(e) => setEditForm({ ...editForm, ownerInfo: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🗄️ Database Access Parameters</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div>
                      <input disabled={isReadOnly} type="text" placeholder="DB Host" value={editForm.dbHost} onChange={(e) => setEditForm({ ...editForm, dbHost: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }} />
                    </div>
                    <div>
                      <input disabled={isReadOnly} type="text" placeholder="DB Port" value={editForm.dbPort} onChange={(e) => setEditForm({ ...editForm, dbPort: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input disabled={isReadOnly} type="text" placeholder="DB Username" value={editForm.dbUser} onChange={(e) => setEditForm({ ...editForm, dbUser: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }} />
                    <input disabled={isReadOnly} type="password" placeholder="DB Password (Hidden)" value={editForm.dbPassword} onChange={(e) => setEditForm({ ...editForm, dbPassword: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }} />
                  </div>
                </div>

                {!isReadOnly && (
                  <div style={{ marginTop: '1rem' }}>
                    <button type="submit" className="btn-primary">Save Settings</button>
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="col-4">
            <div className="stat-card-modern" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Connection Health</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold', color: website.status === 'connected' ? 'var(--success)' : 'var(--danger)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: website.status === 'connected' ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }} />
                {website.status === 'connected' ? 'Healthy Node' : 'Connection Error'}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Verified domain ping and secure token handshake status.
              </p>
            </div>

            <div className="stat-card-modern" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Synchronization Status</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold', color: website.syncStatus === 'synced' ? 'var(--primary)' : 'var(--warning)' }}>
                {website.syncStatus === 'synced' ? '✓ Synced' : '⚠️ Sync Issue'}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Last synced: {new Date(website.lastSyncedAt).toLocaleString()}
              </p>
            </div>

            <div className="stat-card-modern" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Watchers</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                👁️ {socketStatus === 'connected' ? '1 Active' : '0 Offline'}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                WebSocket listeners assigned to monitor client-side events.
              </p>
              <button
                onClick={handleReconnectSocket}
                className="btn-secondary"
                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', marginTop: '0.5rem', width: '100%' }}
              >
                Reconnect WebSocket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ROUTE MANAGER */}
      {activeTab === 'routes' && (
        <div className="chart-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-h1)' }}>Website Frontend Pages & Routes</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search routes..."
                value={routeSearch}
                onChange={(e) => { setRouteSearch(e.target.value); setRoutePage(1); }}
                style={{
                  padding: '0.45rem 0.6rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              {!isReadOnly && <button className="btn-primary btn-sm" onClick={() => setRouteFormOpen(true)}>+ Add Route</button>}
            </div>
          </div>

          {routeFormOpen && (
            <form onSubmit={handleCreateRoute} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-strong)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>New Frontend Route Path</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Route Path (e.g. /features)</label>
                  <input required type="text" value={newRoute.path} onChange={(e) => setNewRoute({ ...newRoute, path: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Page Title</label>
                  <input required type="text" value={newRoute.title} onChange={(e) => setNewRoute({ ...newRoute, title: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Route Type</label>
                  <select value={newRoute.type} onChange={(e) => setNewRoute({ ...newRoute, type: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    <option value="page">Page (Static)</option>
                    <option value="dynamic">Dynamic Page</option>
                    <option value="api">API Endpoint</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Meta Title</label>
                  <input type="text" value={newRoute.metaTitle} onChange={(e) => setNewRoute({ ...newRoute, metaTitle: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Meta Description</label>
                  <input type="text" value={newRoute.metaDescription} onChange={(e) => setNewRoute({ ...newRoute, metaDescription: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Assign Modules (comma-separated)</label>
                  <input type="text" placeholder="seo, content, crm" value={newRoute.associatedModules} onChange={(e) => setNewRoute({ ...newRoute, associatedModules: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary btn-sm" onClick={() => setRouteFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary btn-sm">Add & Sync</button>
              </div>
            </form>
          )}

          {filteredRoutes.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No routes found matching filter.</div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Path</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Page Title</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Assigned Modules</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Last Modified</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRoutes.map((route) => {
                    const info = getRouteTypeAndModules(route);
                    return (
                      <tr key={route.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>{route.path}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{route.title}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)', textTransform: 'uppercase' }}>
                            {info.type}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: route.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            background: route.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(150,150,150,0.1)'
                          }}>
                            {route.status ? route.status.toUpperCase() : 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {info.modules.length > 0 ? info.modules.map(mod => (
                              <span key={mod} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '3px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                                {mod}
                              </span>
                            )) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {new Date(route.updatedAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                          <button
                            className="btn-secondary btn-sm"
                            style={{ marginRight: '0.5rem' }}
                            onClick={() => {
                              handleSelectRouteForEditor(route);
                              setActiveTab('editor');
                            }}
                          >
                            ✏️ Edit Content
                          </button>
                          <button
                            className="btn-secondary btn-sm"
                            style={{ marginRight: '0.5rem' }}
                            onClick={() => handleOpenEditRouteSettings(route)}
                          >
                            ⚙️ Edit Route
                          </button>
                          {!isReadOnly && (
                            <button className="btn-secondary btn-sm btn-danger" onClick={() => handleDeleteRoute(route.id)}>
                              ✕ Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Routes Pagination */}
              {totalRoutePages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
                  <button
                    disabled={routePage === 1}
                    onClick={() => setRoutePage(p => Math.max(p - 1, 1))}
                    className="btn-secondary btn-sm"
                  >
                    ◀ Prev
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Page <strong>{routePage}</strong> of {totalRoutePages}
                  </span>
                  <button
                    disabled={routePage === totalRoutePages}
                    onClick={() => setRoutePage(p => Math.min(p + 1, totalRoutePages))}
                    className="btn-secondary btn-sm"
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 3. CONTENT EDITOR */}
      {activeTab === 'editor' && (
        <div className="dashboard-grid">
          {/* Sidebar selector */}
          <div className="col-4">
            <div className="chart-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-h1)' }}>Select Route to Edit</h3>
              {routes.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRouteForEditor(r)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedRoute?.id === r.id ? 'var(--gradient-primary)' : 'var(--bg-card-hover)',
                    border: '1px solid var(--border-light)',
                    color: selectedRoute?.id === r.id ? '#fff' : 'var(--text-primary)',
                    fontWeight: selectedRoute?.id === r.id ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{r.title}</span>
                    <code style={{ fontSize: '0.75rem', opacity: 0.8 }}>{r.path}</code>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main content editor area */}
          <div className="col-8">
            {selectedRoute ? (
              <div className="chart-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-h1)' }}>
                    Editing Content: <code style={{ color: 'var(--primary)' }}>{selectedRoute.path}</code>
                  </h3>
                  {!isReadOnly && <button className="btn-primary btn-sm" onClick={handleSaveContent}>Save & Push Sync</button>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Meta Details */}
                  <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '0.75rem' }}>Page SEO Parameters</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Page Menu Title</label>
                          <input disabled={isReadOnly} type="text" value={editorContent.title} onChange={(e) => setEditorContent({ ...editorContent, title: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Meta SEO Title</label>
                          <input disabled={isReadOnly} type="text" value={editorContent.metaTitle} onChange={(e) => setEditorContent({ ...editorContent, metaTitle: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Meta Description</label>
                        <textarea disabled={isReadOnly} value={editorContent.metaDescription} onChange={(e) => setEditorContent({ ...editorContent, metaDescription: e.target.value })} rows={2} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Route Type</label>
                          <select disabled={isReadOnly} value={editorContent.type} onChange={(e) => setEditorContent({ ...editorContent, type: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            <option value="page">Page (Static)</option>
                            <option value="dynamic">Dynamic Page</option>
                            <option value="api">API Endpoint</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Assigned Modules</label>
                          <input disabled={isReadOnly} type="text" placeholder="e.g. content, crm" value={editorContent.associatedModules} onChange={(e) => setEditorContent({ ...editorContent, associatedModules: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hero Banner Section */}
                  <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '0.75rem' }}>Hero Banner Configuration</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Hero Main Title</label>
                        <input disabled={isReadOnly} type="text" value={editorContent.bannerTitle} onChange={(e) => setEditorContent({ ...editorContent, bannerTitle: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Hero Subtitle</label>
                        <input disabled={isReadOnly} type="text" value={editorContent.bannerSubtitle} onChange={(e) => setEditorContent({ ...editorContent, bannerSubtitle: e.target.value })} style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                      </div>
                    </div>
                  </div>

                  {/* Section Content Blocks */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>Page Content Blocks / Sections</h4>
                      {!isReadOnly && <button className="btn-secondary btn-sm" onClick={handleAddEditorSection}>+ Add Block</button>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {editorContent.sections.map((sect, sIndex) => (
                        <div key={sect.id} style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', position: 'relative' }}>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleRemoveEditorSection(sIndex)}
                              style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                            >
                              ✕ Remove
                            </button>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Block Title</label>
                              <input disabled={isReadOnly} type="text" value={sect.title} onChange={(e) => handleEditorSectionChange(sIndex, 'title', e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Block Layout Type</label>
                              <select disabled={isReadOnly} value={sect.type} onChange={(e) => handleEditorSectionChange(sIndex, 'type', e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                <option value="hero">Hero Block</option>
                                <option value="about">About / Info Section</option>
                                <option value="features">Features / Services Grid</option>
                                <option value="cta">Call to Action Bar</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Block Body Text</label>
                            <textarea disabled={isReadOnly} value={sect.text || ''} onChange={(e) => handleEditorSectionChange(sIndex, 'text', e.target.value)} rows={3} style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.8rem', resize: 'vertical' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button className="btn-primary" onClick={handleSaveContent}>Save & Sync to Live Website</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                Please create a route in the Route Manager to begin editing page contents.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. API MANAGER */}
      {activeTab === 'apis' && (
        <div className="chart-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-h1)' }}>Discovered API Endpoints</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Detect and catalog available API interfaces on the connected website.
              </p>
            </div>
            {!isReadOnly && (
              <button className="btn-primary btn-sm" onClick={handleScanApis} disabled={scanningApis}>
                {scanningApis ? 'Scanning...' : '🔍 Scan client APIs'}
              </button>
            )}
          </div>

          {apis.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
              No endpoints discovered yet. Click "Scan client APIs" to fetch them from the agent.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem', width: '100px' }}>Method</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Path</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Description</th>
                  <th style={{ padding: '0.75rem 0.5rem', width: '150px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {apis.map((api) => {
                  const methodColors = {
                    GET: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
                    POST: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
                    PUT: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
                    PATCH: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
                    DELETE: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                  };
                  const mStyle = methodColors[api.method] || { bg: 'rgba(150,150,150,0.1)', color: '#999' };
                  return (
                    <tr key={api.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', ...mStyle }}>
                          {api.method}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {api.path}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {api.description || 'No description provided'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--success)', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(16,185,129,0.1)' }}>
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 5. MODULE MANAGER */}
      {activeTab === 'modules' && (
        <div className="chart-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-h1)' }}>Module Synchronization</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Toggle which features and dashboards are enabled for this connected website.
              </p>
            </div>
            {!isReadOnly && (
              <button className="btn-primary btn-sm" onClick={handleSyncModules} disabled={syncingModules}>
                {syncingModules ? 'Saving...' : '💾 Sync Modules'}
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {Object.keys(modules).map((key) => {
              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-base)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {modules[key] ? 'Enabled on target site' : 'Disabled on target site'}
                    </span>
                  </div>
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', opacity: isReadOnly ? 0.6 : 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}>
                    <input 
                      type="checkbox" 
                      disabled={isReadOnly}
                      checked={modules[key]} 
                      onChange={() => handleToggleModule(key)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: isReadOnly ? 'not-allowed' : 'pointer',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: modules[key] ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                      transition: '.3s',
                      borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px', width: '18px',
                        left: modules[key] ? '22px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#fff',
                        transition: '.3s',
                        borderRadius: '50%'
                      }} />
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
          
          {!isReadOnly && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleSyncModules} disabled={syncingModules}>
                {syncingModules ? 'Saving & Pushing...' : 'Save & Push Configuration'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. ACTIVITY LOGS */}
      {activeTab === 'logs' && (
        <div className="chart-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-h1)' }}>Connection Activity & Audit Logs</h3>

          {logs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No activity logs recorded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.25rem' }}>
                    {log.status === 'success' ? '🟢' : '🔴'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{log.action}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem', whiteSpace: 'pre-line' }}>{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Route settings Edit Modal */}
      {editRouteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyHeight: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '2rem', maxWidth: '550px', width: '100%', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
            <button onClick={() => setEditRouteModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-h1)', marginBottom: '1rem' }}>⚙️ Edit Route settings & Parameters</h3>
            
            <form onSubmit={handleSaveRouteSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Route Path</label>
                <input required disabled={isReadOnly} type="text" value={routeEditForm.path} onChange={(e) => setRouteEditForm({ ...routeEditForm, path: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Page Title</label>
                  <input required disabled={isReadOnly} type="text" value={routeEditForm.title} onChange={(e) => setRouteEditForm({ ...routeEditForm, title: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Route Type</label>
                  <select disabled={isReadOnly} value={routeEditForm.type} onChange={(e) => setRouteEditForm({ ...routeEditForm, type: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    <option value="page">Page (Static)</option>
                    <option value="dynamic">Dynamic Page</option>
                    <option value="api">API Endpoint</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Meta SEO Title</label>
                <input disabled={isReadOnly} type="text" value={routeEditForm.metaTitle} onChange={(e) => setRouteEditForm({ ...routeEditForm, metaTitle: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Meta SEO Description</label>
                <textarea disabled={isReadOnly} value={routeEditForm.metaDescription} onChange={(e) => setRouteEditForm({ ...routeEditForm, metaDescription: e.target.value })} rows={2} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Route status</label>
                  <select disabled={isReadOnly} value={routeEditForm.status} onChange={(e) => setRouteEditForm({ ...routeEditForm, status: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Assign Modules (comma-separated)</label>
                  <input disabled={isReadOnly} type="text" placeholder="seo, content, users" value={routeEditForm.associatedModules} onChange={(e) => setRouteEditForm({ ...routeEditForm, associatedModules: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setEditRouteModalOpen(false)}>Cancel</button>
                {!isReadOnly && <button type="submit" className="btn-primary">Save & Synchronize</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
