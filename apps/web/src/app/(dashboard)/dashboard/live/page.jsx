'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const PROJECT_ID = 'default';

export default function LiveVisitorsPage() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('live');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    const es = new EventSource(`/api/visitors/stream?projectId=${PROJECT_ID}`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data));
        setError(null);
      } catch { /* ignore */ }
    };
    es.onerror = () => {
      setConnected(false);
      setError('Stream disconnected. Reconnecting...');
    };

    return () => es.close();
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    const res = await fetch(`/api/visitors/logs?projectId=${PROJECT_ID}&page=${logPage}&limit=20`);
    const d = await res.json();
    setLogs(d.logs || []);
    setLogTotal(d.pagination?.total || 0);
    setLogsLoading(false);
  }, [logPage]);

  useEffect(() => {
    if (tab === 'logs') loadLogs();
  }, [tab, loadLogs]);

  const formatDuration = (s) => {
    if (!s) return '0s';
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

  return (
    <div className="live-page">
      <div className="page-header">
        <h1>Live Visitor Dashboard</h1>
        <div className="live-indicator" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="pulse" style={{
            width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
            background: connected ? '#22c55e' : '#f59e0b',
            boxShadow: connected ? '0 0 0 0 rgba(34,197,94,0.4)' : 'none',
            animation: connected ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: '0.875rem', color: connected ? '#22c55e' : 'var(--text-muted)', fontWeight: 600 }}>
            {connected ? 'Live' : 'Connecting...'}
          </span>
          {data && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              · {data.activeCount} active · {data.totalToday} today
            </span>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[['live', '🔴 Active Visitors'], ['pages', '📄 Top Pages'], ['devices', '📱 Devices'], ['logs', '📋 Session Logs']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1.25rem',
            fontSize: '0.875rem', fontWeight: tab === key ? 700 : 400,
            color: tab === key ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'live' && (
        <>
          {!data || data.activeCount === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">No active visitors</div>
              <div className="empty-desc">Install the SDK on your frontend to track live visitors. The SDK sends heartbeat signals every 10 seconds.</div>
            </div>
          ) : (
            <div className="visitors-list">
              {data.sessions.map((v) => (
                <div key={v.id} className="visitor-card">
                  <div className="visitor-info">
                    <div className="visitor-page" style={{ fontWeight: 600 }}>{v.page}</div>
                    <div className="visitor-meta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {v.ip && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>IP: {v.ip}</span>}
                      {v.country && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>📍 {v.country}</span>}
                      {v.device && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>📱 {v.device}</span>}
                      {v.browser && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{v.browser}</span>}
                      {v.source && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>via {v.source}</span>}
                    </div>
                  </div>
                  <div className="visitor-time" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{timeAgo(v.lastSeen)}</span>
                    {v.duration > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDuration(v.duration)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'pages' && (
        <div>
          {!data?.byPage?.length ? (
            <div className="empty-state"><div className="empty-desc">No page data available.</div></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Page</th><th>Active Visitors</th></tr></thead>
              <tbody>
                {data.byPage.map((p, i) => (
                  <tr key={i}>
                    <td><code>{p.page}</code></td>
                    <td><span className="badge badge-published">{p.count}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'devices' && (
        <div>
          {!data?.byDevice?.length ? (
            <div className="empty-state"><div className="empty-desc">No device data available.</div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {data.byDevice.map((d, i) => (
                <div key={i} className="metric-card">
                  <div className="metric-value">{d.count}</div>
                  <div className="metric-label">{d.device}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <>
          {logsLoading ? (
            <div className="loading">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="empty-state"><div className="empty-desc">No session logs yet.</div></div>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {logTotal} total sessions
              </p>
              <table className="data-table">
                <thead><tr><th>Page</th><th>Device</th><th>Browser</th><th>IP</th><th>Source</th><th>Time</th></tr></thead>
                <tbody>
                  {logs.map((l) => (
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
                <button className="btn-sm" disabled={logPage === 1} onClick={() => setLogPage((p) => p - 1)}>← Prev</button>
                <span style={{ padding: '0 1rem', lineHeight: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Page {logPage}</span>
                <button className="btn-sm" disabled={logs.length < 20} onClick={() => setLogPage((p) => p + 1)}>Next →</button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}