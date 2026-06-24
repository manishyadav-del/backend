'use client';

import { useState, useEffect } from 'react';

export default function WebsiteAssignmentTab({ moduleKey }) {
  const [websites, setWebsites] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (moduleKey) {
      fetchAssignments();
      fetchLogs();
    }
  }, [moduleKey]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/websites/assignments?moduleKey=${moduleKey}`);
      const json = await res.json();
      if (json.success) {
        setWebsites(json.data);
      } else {
        setError(json.error || 'Failed to load assignments');
      }
    } catch (err) {
      setError('Error loading assignments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      // Mock/load logs logic
      const res = await fetch(`/api/websites/1/logs`); // Load from any logs API or similar
      const json = await res.json();
      if (json.success) {
        // Filter logs specifically related to this module sync
        const moduleLogs = json.data.filter(l => l.action === 'SYNC_MODULE' || l.action === 'ASSIGN_MODULE');
        setLogs(moduleLogs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const handleToggleWebsite = (id) => {
    setWebsites(prev =>
      prev.map(site => site.id === id ? { ...site, assigned: !site.assigned } : site)
    );
  };

  const handleSelectAll = (val) => {
    setWebsites(prev => prev.map(site => ({ ...site, assigned: val })));
  };

  const handleSaveAndSync = async () => {
    setSyncing(true);
    setError('');
    setSuccessMsg('');

    const assignedIds = websites.filter(w => w.assigned).map(w => w.id);
    const unassignedIds = websites.filter(w => !w.assigned).map(w => w.id);

    try {
      // 1. Save assignments
      if (assignedIds.length > 0) {
        await fetch('/api/websites/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleKey, websiteIds: assignedIds, status: 'enabled' })
        });
      }
      if (unassignedIds.length > 0) {
        await fetch('/api/websites/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleKey, websiteIds: unassignedIds, status: 'disabled' })
        });
      }

      // 2. Trigger Synchronization
      if (assignedIds.length > 0) {
        const syncRes = await fetch('/api/websites/assignments/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleKey, websiteIds: assignedIds })
        });
        const syncJson = await syncRes.json();
        
        if (syncJson.success) {
          setSuccessMsg(`Successfully synchronized configuration changes for "${moduleKey}" across assigned websites.`);
        } else {
          setError(syncJson.error || 'Failed to trigger synchronization');
        }
      } else {
        setSuccessMsg('Configurations updated locally. No websites are assigned for push synchronization.');
      }

      await fetchAssignments();
      await fetchLogs();
    } catch (err) {
      setError('Error during synchronization process.');
    } finally {
      setSyncing(false);
    }
  };

  const allSelected = websites.length > 0 && websites.every(w => w.assigned);

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Module Mapping Assignment */}
        <div className="chart-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h1)', marginBottom: '0.25rem' }}>Website Assignments</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            Map this module and settings to connected external websites.
          </p>

          {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {error}</div>}
          {successMsg && <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>✓ {successMsg}</div>}

          {loading ? (
            <div className="loading" style={{ padding: '2rem 0' }}>Fetching website connections...</div>
          ) : websites.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-base)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
              No connected websites found in dashboard database.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Select All Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                <input 
                  type="checkbox" 
                  id="select-all" 
                  checked={allSelected} 
                  onChange={(e) => handleSelectAll(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="select-all" style={{ fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Select All Connected Websites
                </label>
              </div>

              {/* Websites checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {websites.map(site => (
                  <div key={site.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-base)', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input 
                        type="checkbox" 
                        id={`site-${site.id}`}
                        checked={site.assigned}
                        onChange={() => handleToggleWebsite(site.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor={`site-${site.id}`} style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {site.name} <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({site.domain})</code>
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {site.assigned ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: site.syncStatus === 'synced' ? 'var(--success)' : 'var(--warning)', background: site.syncStatus === 'synced' ? 'var(--success-bg)' : 'rgba(245,158,11,0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          {site.syncStatus.toUpperCase()}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', background: 'rgba(150,150,150,0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          UNASSIGNED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn-primary" onClick={handleSaveAndSync} disabled={syncing} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  {syncing ? 'Synchronizing...' : '🔄 Apply & Synchronize'}
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Sync logs and settings panel */}
        <div className="chart-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h1)', marginBottom: '1rem' }}>Sync History</h3>

          {logs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-base)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
              No recent synchronization events recorded for this module.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.1rem' }}>{log.status === 'success' ? '🟢' : '🔴'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{log.action}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', whiteSpace: 'pre-line' }}>{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
