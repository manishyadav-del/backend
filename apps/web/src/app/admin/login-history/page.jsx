'use client';

import { useEffect, useState, useCallback } from 'react';

function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Desktop' };
  let browser = 'Unknown', os = 'Unknown', device = 'Desktop';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';
  else if (/Android/.test(ua)) { os = 'Android'; device = 'Mobile'; }
  else if (/iPhone|iPad/.test(ua)) { os = 'iOS'; device = /iPad/.test(ua) ? 'Tablet' : 'Mobile'; }
  return { browser, os, device };
}

export default function LoginHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState(''); // '', 'true', 'false'

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter !== '') params.set('success', filter);
      const res = await fetch(`/api/login-history?${params}`);
      const data = await res.json();
      setHistory(data.history || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
      setError(null);
    } catch {
      setError('Failed to load login history');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const formatDate = (d) => {
    return new Date(d).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="login-history-page">
      <div className="page-header">
        <h1>Login History</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {total} total entries
          </span>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <option value="">All Attempts</option>
            <option value="true">Successful Only</option>
            <option value="false">Failed Only</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading login history...</div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔐</div>
          <div className="empty-title">No login history found</div>
          <div className="empty-desc">Login attempts will appear here</div>
        </div>
      ) : (
        <>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Browser</th>
                  <th>OS</th>
                  <th>Device</th>
                  <th>IP Address</th>
                  <th>Location</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => {
                  const { browser, os, device } = parseUserAgent(entry.userAgent);
                  return (
                    <tr key={entry.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                          {entry.user?.name || entry.user?.email || '—'}
                        </div>
                        {entry.user?.name && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {entry.user.email}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${entry.success ? 'badge-published' : 'badge-archived'}`}>
                          {entry.success ? '✓ Success' : '✗ Failed'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{browser}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{os}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{device}</td>
                      <td>
                        <code style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {entry.ip || '—'}
                        </code>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {entry.location || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1.5rem', justifyContent: 'center' }}>
              <button
                className="btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '0 0.5rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
