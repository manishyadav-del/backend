'use client';

import { useEffect, useState, useCallback } from 'react';

const PROJECT_ID = 'default';

export default function PerformancePage() {
  const [metrics, setMetrics] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorsLoading, setErrorsLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [clearingLogs, setClearingLogs] = useState(false);
  const [message, setMessage] = useState('');

  const loadMetrics = useCallback(async () => {
    try {
      const res = await fetch(`/api/performance/metrics?projectId=${PROJECT_ID}`);
      const data = await res.json();
      if (data.success) setMetrics(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const loadErrors = useCallback(async () => {
    setErrorsLoading(true);
    try {
      const res = await fetch(`/api/performance/errors?limit=50`);
      const data = await res.json();
      setErrors(data.logs || []);
    } catch { /* ignore */ }
    setErrorsLoading(false);
  }, []);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  useEffect(() => {
    if (tab === 'errors') loadErrors();
  }, [tab, loadErrors]);

  const clearLogs = async () => {
    if (!confirm('Delete error logs older than 7 days?')) return;
    setClearingLogs(true);
    const res = await fetch('/api/performance/errors?olderThan=7', { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setMessage(`Cleared ${data.deleted} old log entries.`);
      loadErrors();
    }
    setClearingLogs(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const dbHealthColor = (health) => {
    if (health === 'excellent') return '#22c55e';
    if (health === 'good') return '#f59e0b';
    return '#ef4444';
  };

  const memColor = (pct) => pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22c55e';

  if (loading) return <div className="loading">Loading metrics...</div>;

  return (
    <div className="performance-page">
      <div className="page-header">
        <h1>Performance</h1>
        <button className="btn-sm" onClick={loadMetrics}>↺ Refresh</button>
      </div>

      {message && <div className="success-message">{message}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[['overview', '📊 Overview'], ['system', '⚙️ System'], ['errors', '🚨 Error Logs'], ['records', '📁 Records']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1.25rem',
            fontSize: '0.875rem', fontWeight: tab === key ? 700 : 400,
            color: tab === key ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && metrics && (
        <div className="performance-grid">
          <div className="metric-card">
            <div className="metric-value" style={{ color: dbHealthColor(metrics.database?.health) }}>
              {metrics.database?.responseMs ?? '—'}ms
            </div>
            <div className="metric-label">DB Response Time</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Status: <span style={{ color: dbHealthColor(metrics.database?.health) }}>{metrics.database?.status}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.system?.uptimeFormatted || '—'}</div>
            <div className="metric-label">Server Uptime</div>
          </div>
          <div className="metric-card">
            <div className="metric-value" style={{ color: memColor(metrics.system?.memory?.usagePercent) }}>
              {metrics.system?.memory?.usagePercent ?? '—'}%
            </div>
            <div className="metric-label">Memory Usage</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {metrics.system?.memory?.heapUsed} / {metrics.system?.memory?.heapTotal}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-value" style={{ color: metrics.errors?.last24h > 0 ? '#ef4444' : '#22c55e' }}>
              {metrics.errors?.last24h ?? 0}
            </div>
            <div className="metric-label">Errors (24h)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {metrics.errors?.warnings24h ?? 0} warnings
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.storage?.used || 'N/A'}</div>
            <div className="metric-label">Storage Used</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.system?.cpuLoad || 'N/A'}</div>
            <div className="metric-label">CPU Load (1m avg)</div>
          </div>
        </div>
      )}

      {tab === 'system' && metrics && (
        <div className="settings-form">
          {[
            ['Node Version', metrics.system?.nodeVersion],
            ['Platform', metrics.system?.platform],
            ['Architecture', metrics.system?.arch],
            ['Process ID', metrics.system?.pid],
            ['RSS Memory', metrics.system?.memory?.rss],
            ['Heap Used', metrics.system?.memory?.heapUsed],
            ['Heap Total', metrics.system?.memory?.heapTotal],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</span>
              <code style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{value || '—'}</code>
            </div>
          ))}
        </div>
      )}

      {tab === 'errors' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{errors.length} recent entries</span>
            <button className="btn-sm btn-danger" onClick={clearLogs} disabled={clearingLogs}>
              {clearingLogs ? 'Clearing...' : 'Clear Old Logs (7d+)'}
            </button>
          </div>
          {errorsLoading ? (
            <div className="loading">Loading...</div>
          ) : errors.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-title">No error logs</div></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Level</th><th>Message</th><th>URL</th><th>Time</th></tr></thead>
              <tbody>
                {errors.map((e) => (
                  <tr key={e.id}>
                    <td><span className={`badge ${e.level === 'error' ? 'badge-archived' : 'badge-draft'}`}>{e.level}</span></td>
                    <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{e.message}</td>
                    <td><code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.url || '—'}</code></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'records' && metrics && (
        <div className="performance-grid">
          {Object.entries(metrics.records || {}).map(([key, value]) => (
            <div key={key} className="metric-card">
              <div className="metric-value">{value}</div>
              <div className="metric-label" style={{ textTransform: 'capitalize' }}>{key}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}