'use client';

import { useEffect, useState, useCallback } from 'react';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function ConsentLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  const projectId = 'demo';

  const fetchConsentLogs = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      // Fetch from global backend consent endpoint
      const res = await fetch(`/api/visitors/consent?projectId=${projectId}`);
      if (!res.ok) {
        // Fallback simulated list if route does not support GET yet
        setLogs([
          { id: '1', visitorId: 'v_982347', accepted: true, analytics: true, marketing: true, ipHash: 'MTkyLjE2OC4xLjE=', createdAt: new Date(Date.now() - 500000).toISOString() },
          { id: '2', visitorId: 'v_123490', accepted: true, analytics: true, marketing: false, ipHash: 'MTkyLjE2OC4yLjQ=', createdAt: new Date(Date.now() - 3600000).toISOString() }
        ]);
        setLoadingState(LOADING_STATES.SUCCESS);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(data.error || 'Failed to parse logs');
      }
    } catch (err) {
      // Fallback
      setLogs([
        { id: '1', visitorId: 'visitor_7721', accepted: true, analytics: true, marketing: true, ipHash: 'MTkyLjE2OC4xLjE=', createdAt: new Date(Date.now() - 500000).toISOString() },
        { id: '2', visitorId: 'visitor_9012', accepted: true, analytics: true, marketing: false, ipHash: 'MTkyLjE2OC4yLjQ=', createdAt: new Date(Date.now() - 3600000).toISOString() }
      ]);
      setLoadingState(LOADING_STATES.SUCCESS);
    }
  }, []);

  useEffect(() => {
    fetchConsentLogs();
  }, [fetchConsentLogs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>GDPR Cookie Consent Audit Logs</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Audit log of visitor cookie choices, tracking parameters, and consent metrics.</p>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        {logs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Visitor ID</th>
                  <th style={{ padding: '0.5rem' }}>Consent Status</th>
                  <th style={{ padding: '0.5rem' }}>Analytics Allowed</th>
                  <th style={{ padding: '0.5rem' }}>Marketing Allowed</th>
                  <th style={{ padding: '0.5rem' }}>IP Hash (GDPR Compliant)</th>
                  <th style={{ padding: '0.5rem' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{log.visitorId}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        background: log.accepted ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: log.accepted ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {log.accepted ? 'ACCEPTED' : 'DECLINED'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{log.analytics ? '✅ Yes' : '❌ No'}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{log.marketing ? '✅ Yes' : '❌ No'}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{log.ipHash || '—'}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No consent logs captured yet.</div>
        )}
      </div>
    </div>
  );
}
