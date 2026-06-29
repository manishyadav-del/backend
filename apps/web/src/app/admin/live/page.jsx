'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const PROJECT_ID = 'default';

const EVENT_CONFIG = {
  'route:update': { icon: '🔀', color: '#8b5cf6', label: 'Route Updated' },
  'route:sync': { icon: '📡', color: '#3b82f6', label: 'Routes Synced' },
  'content:update': { icon: '📝', color: '#f59e0b', label: 'Content Updated' },
  'settings:update': { icon: '⚙️', color: '#6b7280', label: 'Settings Changed' },
  'connect': { icon: '🔌', color: '#10b981', label: 'Website Connected' },
  'website:sync': { icon: '🌐', color: '#10b981', label: 'Website Synced' },
  'CONNECT': { icon: '🔌', color: '#10b981', label: 'Connected' },
  'SYNC_ROUTES': { icon: '📡', color: '#3b82f6', label: 'Routes Synced' },
  'UPDATE_ROUTE': { icon: '🔀', color: '#8b5cf6', label: 'Route Updated' },
  'UPDATE_CONTENT': { icon: '📝', color: '#f59e0b', label: 'Content Updated' },
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function LivePage() {
  const [tab, setTab] = useState('sync');

  // --- Visitors state ---
  const [visitorData, setVisitorData] = useState(null);
  const [visitorConnected, setVisitorConnected] = useState(false);
  const [visitorError, setVisitorError] = useState(null);
  const [visitorTab, setVisitorTab] = useState('live');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const eventSourceRef = useRef(null);

  // --- Sync Monitor state ---
  const [syncEvents, setSyncEvents] = useState([]);
  const [syncConnected, setSyncConnected] = useState(false);
  const [syncFilter, setSyncFilter] = useState('all');
  const [websites, setWebsites] = useState([]);
  const [websiteFilter, setWebsiteFilter] = useState('all');
  const [recentDbLogs, setRecentDbLogs] = useState([]);
  const socketRef = useRef(null);
  const syncEventsRef = useRef([]);

  // Visitor SSE
  useEffect(() => {
    const es = new EventSource(`/api/visitors/stream?projectId=${PROJECT_ID}`);
    eventSourceRef.current = es;
    es.onopen = () => setVisitorConnected(true);
    es.onmessage = (e) => {
      try { setVisitorData(JSON.parse(e.data)); setVisitorError(null); } catch {}
    };
    es.onerror = () => { setVisitorConnected(false); setVisitorError('Stream disconnected. Reconnecting...'); };
    return () => es.close();
  }, []);

  // Sync WebSocket
  useEffect(() => {
    const initSocket = async () => {
      await fetch('/api/socket').catch(() => {});
      const socket = io({ path: '/api/socket', reconnectionDelay: 2000 });
      socketRef.current = socket;

      socket.on('connect', () => {
        setSyncConnected(true);
        socket.emit('join-website', 'monitor'); // join monitor room
      });
      socket.on('disconnect', () => setSyncConnected(false));

      // Receive sync events from all websites
      socket.on('sync:event', (event) => {
        addSyncEvent(event);
      });
      socket.on('website:sync', (event) => {
        addSyncEvent(event);
      });
    };

    initSocket();
    fetchWebsites();
    fetchRecentLogs();

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  const addSyncEvent = (event) => {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: event.timestamp || new Date().toISOString(),
      type: event.type || event.action || 'sync',
      websiteId: event.websiteId,
      message: event.message || event.details || JSON.stringify(event),
      data: event,
    };
    syncEventsRef.current = [entry, ...syncEventsRef.current].slice(0, 200);
    setSyncEvents([...syncEventsRef.current]);
  };

  const fetchWebsites = async () => {
    const res = await fetch('/api/websites').catch(() => null);
    if (!res) return;
    const json = await res.json();
    if (json.success) setWebsites(json.data || []);
  };

  const fetchRecentLogs = async () => {
    const res = await fetch('/api/activity-logs?limit=30').catch(() => null);
    if (!res) return;
    const json = await res.json().catch(() => ({}));
    setRecentDbLogs(json.data || json.logs || []);
  };

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    const res = await fetch(`/api/visitors/logs?projectId=${PROJECT_ID}&page=${logPage}&limit=20`);
    const d = await res.json();
    setLogs(d.logs || []);
    setLogTotal(d.pagination?.total || 0);
    setLogsLoading(false);
  }, [logPage]);

  useEffect(() => {
    if (visitorTab === 'logs') loadLogs();
  }, [visitorTab, loadLogs]);

  const filteredSync = syncEvents.filter(e => {
    const matchType = syncFilter === 'all' || e.type === syncFilter;
    const matchSite = websiteFilter === 'all' || e.websiteId === websiteFilter;
    return matchType && matchSite;
  });

  const formatDuration = (s) => { if (!s) return '0s'; if (s < 60) return `${s}s`; return `${Math.floor(s / 60)}m ${s % 60}s`; };
  const taV = (d) => { const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return `${s}s ago`; return `${Math.floor(s / 60)}m ago`; };

  const tabStyle = (key) => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1.25rem',
    fontSize: '0.875rem', fontWeight: tab === key ? 700 : 400,
    color: tab === key ? 'var(--accent, var(--primary))' : 'var(--text-secondary)',
    borderBottom: tab === key ? '2px solid var(--accent, var(--primary))' : '2px solid transparent',
    marginBottom: '-1px',
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Live Monitor</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Real-time visitor tracking and synchronization event stream.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: visitorConnected ? '#22c55e' : '#f59e0b' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: visitorConnected ? '#22c55e' : '#f59e0b', display: 'inline-block', animation: visitorConnected ? 'pulse 2s infinite' : 'none' }} />
            Visitors {visitorConnected ? 'Live' : 'Connecting...'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: syncConnected ? '#10b981' : '#6b7280' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: syncConnected ? '#10b981' : '#6b7280', display: 'inline-block' }} />
            Sync {syncConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[['sync', '⚡ Sync Monitor'], ['visitors', '👥 Live Visitors']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={tabStyle(key)}>{label}</button>
        ))}
      </div>

      {/* ===== SYNC MONITOR TAB ===== */}
      {tab === 'sync' && (
        <div>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Events Received', value: syncEvents.length, icon: '📊' },
              { label: 'Connected Sites', value: websites.length, icon: '🌐' },
              { label: 'Route Updates', value: syncEvents.filter(e => e.type?.includes('route')).length, icon: '🔀' },
              { label: 'Content Updates', value: syncEvents.filter(e => e.type?.includes('content')).length, icon: '📝' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <select value={syncFilter} onChange={e => setSyncFilter(e.target.value)} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              <option value="all">All Event Types</option>
              <option value="route:sync">Route Sync</option>
              <option value="route:update">Route Update</option>
              <option value="content:update">Content Update</option>
              <option value="connect">Connect</option>
            </select>
            <select value={websiteFilter} onChange={e => setWebsiteFilter(e.target.value)} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-input, var(--bg-card))', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              <option value="all">All Websites</option>
              {websites.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <button onClick={() => { setSyncEvents([]); syncEventsRef.current = []; }} style={{ padding: '0.5rem 0.75rem', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
              🗑️ Clear
            </button>
            <button onClick={fetchRecentLogs} style={{ padding: '0.5rem 0.75rem', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
              🔄 Refresh DB Logs
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Live Event Stream */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: syncConnected ? '#10b981' : '#6b7280', display: 'inline-block', animation: syncConnected ? 'pulse 1.5s infinite' : 'none' }} />
                  Live Event Stream
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{filteredSync.length} events</span>
              </div>
              <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.5rem' }}>
                {filteredSync.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡</div>
                    Waiting for sync events...
                    <br />
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Events appear here when the SDK syncs routes or content.</span>
                  </div>
                ) : filteredSync.map(event => {
                  const cfg = EVENT_CONFIG[event.type] || { icon: '🔔', color: '#6b7280', label: event.type };
                  const site = websites.find(w => w.id === event.websiteId);
                  return (
                    <div key={event.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '0.25rem', border: '1px solid var(--border-light)', background: 'var(--bg-base)' }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{cfg.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(event.timestamp)}</span>
                        </div>
                        {site && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>🌐 {site.name}</div>}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent DB Activity */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h1)' }}>📋 Recent Sync Logs</h3>
              </div>
              <RecentSyncLogs />
            </div>
          </div>
        </div>
      )}

      {/* ===== VISITORS TAB ===== */}
      {tab === 'visitors' && (
        <div>
          {visitorError && <div className="alert" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', border: '1px solid rgba(245,158,11,0.3)' }}>{visitorError}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {[['live', '🔴 Active Visitors'], ['pages', '📄 Top Pages'], ['devices', '📱 Devices'], ['logs', '📋 Session Logs']].map(([key, label]) => (
              <button key={key} onClick={() => setVisitorTab(key)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1.25rem',
                fontSize: '0.875rem', fontWeight: visitorTab === key ? 700 : 400,
                color: visitorTab === key ? 'var(--accent, var(--primary))' : 'var(--text-secondary)',
                borderBottom: visitorTab === key ? '2px solid var(--accent, var(--primary))' : '2px solid transparent',
                marginBottom: '-1px',
              }}>{label}</button>
            ))}
          </div>

          {visitorTab === 'live' && (
            <>
              {!visitorData || visitorData.activeCount === 0 ? (
                <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">No active visitors</div><div className="empty-desc">Install the SDK on your frontend to track live visitors.</div></div>
              ) : (
                <div className="visitors-list">
                  {visitorData.sessions.map((v) => (
                    <div key={v.id} className="visitor-card">
                      <div className="visitor-info">
                        <div style={{ fontWeight: 600 }}>{v.page}</div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          {v.ip && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>IP: {v.ip}</span>}
                          {v.country && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>📍 {v.country}</span>}
                          {v.device && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>📱 {v.device}</span>}
                          {v.browser && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{v.browser}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{taV(v.lastSeen)}</span>
                        {v.duration > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDuration(v.duration)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {visitorTab === 'pages' && (
            !visitorData?.byPage?.length ? (
              <div className="empty-state"><div className="empty-desc">No page data available.</div></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Page</th><th>Active Visitors</th></tr></thead>
                <tbody>{visitorData.byPage.map((p, i) => (<tr key={i}><td><code>{p.page}</code></td><td><span className="badge badge-published">{p.count}</span></td></tr>))}</tbody>
              </table>
            )
          )}

          {visitorTab === 'devices' && (
            !visitorData?.byDevice?.length ? (
              <div className="empty-state"><div className="empty-desc">No device data.</div></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {visitorData.byDevice.map((d, i) => (<div key={i} className="metric-card"><div className="metric-value">{d.count}</div><div className="metric-label">{d.device}</div></div>))}
              </div>
            )
          )}

          {visitorTab === 'logs' && (
            logsLoading ? <div className="loading">Loading logs...</div> : logs.length === 0 ? (
              <div className="empty-state"><div className="empty-desc">No session logs yet.</div></div>
            ) : (
              <>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{logTotal} total sessions</p>
                <table className="data-table">
                  <thead><tr><th>Page</th><th>Device</th><th>Browser</th><th>IP</th><th>Source</th><th>Time</th></tr></thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id}>
                        <td><code style={{ fontSize: '0.8125rem' }}>{l.page}</code></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{l.device || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{l.browser || '—'}</td>
                        <td><code style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{l.ip || '—'}</code></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{l.source || 'direct'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{new Date(l.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                  <button className="btn-sm" disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)}>← Prev</button>
                  <span style={{ padding: '0 1rem', lineHeight: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Page {logPage}</span>
                  <button className="btn-sm" disabled={logs.length < 20} onClick={() => setLogPage(p => p + 1)}>Next →</button>
                </div>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}

function RecentSyncLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sync/status').then(r => r.json()).then(d => {
      // Fallback to activity-logs if sync/status doesn't have logs
    }).catch(() => {});

    // Fetch recent sync logs from backend
    fetch('/api/websites').then(r => r.json()).then(async (websiteRes) => {
      if (!websiteRes.success || !websiteRes.data?.length) { setLoading(false); return; }
      // For each website, we'd normally fetch sync logs - use activity-logs endpoint instead
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const EVENT_CONFIG_LOG = {
    'CONNECT': { icon: '🔌', color: '#10b981' },
    'SYNC_ROUTES': { icon: '📡', color: '#3b82f6' },
    'UPDATE_ROUTE': { icon: '🔀', color: '#8b5cf6' },
    'UPDATE_CONTENT': { icon: '📝', color: '#f59e0b' },
    'SYNC': { icon: '🔄', color: '#10b981' },
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</div>;

  return (
    <div style={{ padding: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
      <ConnectedSyncLogs />
    </div>
  );
}

function ConnectedSyncLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch('/api/websites')
      .then(r => r.json())
      .then(async (res) => {
        if (!res.success || !res.data?.length) return;
        // Fetch logs for first 3 sites
        const allLogs = [];
        for (const site of res.data.slice(0, 3)) {
          const r = await fetch(`/api/websites/${site.id}/logs`).catch(() => null);
          if (!r) continue;
          const j = await r.json().catch(() => ({}));
          const siteLogs = (j.data || j.logs || []).map(l => ({ ...l, siteName: site.name }));
          allLogs.push(...siteLogs);
        }
        allLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLogs(allLogs.slice(0, 30));
      })
      .catch(() => {});
  }, []);

  const ACTION_CFG = {
    'CONNECT': { icon: '🔌', color: '#10b981' },
    'SYNC_ROUTES': { icon: '📡', color: '#3b82f6' },
    'UPDATE_ROUTE': { icon: '🔀', color: '#8b5cf6' },
    'UPDATE_CONTENT': { icon: '📝', color: '#f59e0b' },
    'SYNC': { icon: '🔄', color: '#10b981' },
  };

  if (!logs.length) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
      No sync logs yet. Connect a website to see activity here.
    </div>
  );

  return logs.map((log, i) => {
    const cfg = ACTION_CFG[log.action] || { icon: '📋', color: '#6b7280' };
    return (
      <div key={log.id || i} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.25rem', borderBottom: '1px solid var(--border-light)' }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cfg.color }}>{log.action}</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
          </div>
          {log.siteName && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{log.siteName}</div>}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {log.details}
          </div>
        </div>
      </div>
    );
  });
}