'use client';

import { useEffect, useState, useCallback } from 'react';

const PROJECT_ID = 'default';

export default function DevToolsPage() {
  const [tab, setTab] = useState('api-keys');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Tab 1: API Keys State
  const [apiKeys, setApiKeys] = useState([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyPermissions, setKeyPermissions] = useState(['read:content']);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [savingKey, setSavingKey] = useState(false);

  // Tab 2: Version History State
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [rollingBackId, setRollingBackId] = useState(null);

  // Tab 3: Diagnostics State
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  // Load API keys
  const loadApiKeys = useCallback(async () => {
    try {
      const res = await fetch(`/api/dev-tools/api-keys?projectId=${PROJECT_ID}`);
      const data = await res.json();
      setApiKeys(data.apiKeys || []);
    } catch {
      setError('Failed to load API keys');
    }
  }, []);

  // Load pages list for Version History
  const loadPages = useCallback(async () => {
    try {
      const res = await fetch(`/api/pages?projectId=${PROJECT_ID}`);
      const data = await res.json();
      const pagesList = data.pages || [];
      setPages(pagesList);
      if (pagesList.length > 0 && !selectedPageId) {
        setSelectedPageId(pagesList[0].id);
      }
    } catch {
      setError('Failed to load pages list');
    }
  }, [selectedPageId]);

  // Load page versions
  const loadVersions = useCallback(async (pageId) => {
    if (!pageId) return;
    setVersionsLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/versions`);
      const data = await res.json();
      setVersions(data.versions || []);
    } catch {
      setError('Failed to load versions');
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  // Load diagnostics
  const loadDiagnostics = useCallback(async () => {
    setDiagnosticsLoading(true);
    try {
      const res = await fetch('/api/dev-tools/diagnostics');
      const data = await res.json();
      if (data.success) {
        setDiagnostics(data.data);
      } else {
        setError(data.error || 'Failed to fetch diagnostics');
      }
    } catch {
      setError('Failed to run diagnostics');
    } finally {
      setDiagnosticsLoading(false);
    }
  }, []);

  // Effect to handle tab changes
  useEffect(() => {
    setError('');
    setMessage('');
    if (tab === 'api-keys') {
      loadApiKeys().finally(() => setLoading(false));
    } else if (tab === 'versions') {
      loadPages().finally(() => setLoading(false));
    } else if (tab === 'diagnostics') {
      loadDiagnostics().finally(() => setLoading(false));
    }
  }, [tab, loadApiKeys, loadPages, loadDiagnostics]);

  // Fetch versions when selected page changes
  useEffect(() => {
    if (selectedPageId && tab === 'versions') {
      loadVersions(selectedPageId);
    }
  }, [selectedPageId, tab, loadVersions]);

  // API Key handlers
  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!keyName) return;
    setSavingKey(true);
    setError('');
    try {
      const res = await fetch('/api/dev-tools/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          name: keyName,
          permissions: keyPermissions,
        }),
      });
      const data = await res.json();
      if (res.ok && data.apiKey) {
        setNewlyCreatedKey(data.apiKey.fullKey);
        loadApiKeys();
        setKeyName('');
        setKeyPermissions(['read:content']);
      } else {
        setError(data.error || 'Failed to generate API key');
      }
    } catch {
      setError('Network error creating API key');
    } finally {
      setSavingKey(false);
    }
  };

  const handleToggleKey = async (key) => {
    try {
      const res = await fetch(`/api/dev-tools/api-keys/${key.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !key.isActive,
        }),
      });
      if (res.ok) {
        loadApiKeys();
      }
    } catch {
      setError('Failed to update API key status');
    }
  };

  const handleRevokeKey = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key? Connected frontends will immediately lose access.')) return;
    try {
      const res = await fetch(`/api/dev-tools/api-keys/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessage('API key revoked successfully.');
        loadApiKeys();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setError('Failed to revoke API key');
    }
  };

  const handlePermissionToggle = (perm) => {
    if (keyPermissions.includes(perm)) {
      setKeyPermissions(keyPermissions.filter(p => p !== perm));
    } else {
      setKeyPermissions([...keyPermissions, perm]);
    }
  };

  // Version Restore handler
  const handleRestoreVersion = async (version) => {
    const confirmMsg = `Rollback page back to version ${version.version} ("${version.title}")? This will save the current page state as a new backup version before rolling back.`;
    if (!confirm(confirmMsg)) return;

    setRollingBackId(version.id);
    setError('');
    try {
      const res = await fetch(`/api/pages/${selectedPageId}/versions/${version.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeLog: `Restored back to v${version.version}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Success! Rolled back page to version ${version.version}`);
        loadVersions(selectedPageId);
        setTimeout(() => setMessage(''), 4000);
      } else {
        setError(data.error || 'Failed to rollback to this version');
      }
    } catch {
      setError('Network error during rollback');
    } finally {
      setRollingBackId(null);
    }
  };

  return (
    <div className="dev-tools-page">
      <div className="page-header">
        <h1>Dev / Admin Tools</h1>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[['api-keys', '🔑 API Keys'], ['versions', '📜 Version History'], ['diagnostics', '⚙️ Diagnostics']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1.25rem',
            fontSize: '0.875rem', fontWeight: tab === key ? 700 : 400,
            color: tab === key ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading developer tools...</div>
      ) : (
        <>
          {tab === 'api-keys' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{apiKeys.length} keys configured</span>
                <button className="btn-primary" onClick={() => { setShowKeyModal(true); setNewlyCreatedKey(null); }}>+ Generate API Key</button>
              </div>

              {apiKeys.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔑</div>
                  <div className="empty-title">No API Keys Generated</div>
                  <div className="empty-desc">Generate an API key to allow your Next.js application SDK to connect.</div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Key Name</th>
                      <th>Token Preview</th>
                      <th>Permissions</th>
                      <th>Last Used</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map(k => (
                      <tr key={k.id}>
                        <td style={{ fontWeight: 600 }}>{k.name}</td>
                        <td><code style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{k.keyPreview}</code></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {k.permissions ? JSON.parse(k.permissions).map((p, i) => (
                              <span key={i} className="badge badge-scheduled" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>{p}</span>
                            )) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {k.lastUsed ? new Date(k.lastUsed).toLocaleString() : 'Never'}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleKey(k)}
                            className={`badge ${k.isActive ? 'badge-published' : 'badge-archived'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            {k.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>
                          <button className="btn-sm btn-danger" onClick={() => handleRevokeKey(k.id)}>Revoke</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'versions' && (
            <div>
              <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Select Page to View History:</label>
                <select
                  value={selectedPageId}
                  onChange={(e) => setSelectedPageId(e.target.value)}
                  style={{ width: 'auto', minWidth: '250px', background: 'var(--bg-base)', padding: '0.5rem 1rem' }}
                >
                  <option value="">-- Choose a page --</option>
                  {pages.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.slug})</option>
                  ))}
                </select>
              </div>

              {versionsLoading ? (
                <div className="loading">Loading page versions...</div>
              ) : !selectedPageId ? (
                <div className="empty-state">
                  <div className="empty-desc">Choose a page from the list above to view its version history.</div>
                </div>
              ) : versions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📜</div>
                  <div className="empty-title">No Version History</div>
                  <div className="empty-desc">Versions are created automatically whenever a page is edited and saved.</div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ver</th>
                      <th>Title</th>
                      <th>Slug</th>
                      <th>Change Description</th>
                      <th>Saved Date &amp; Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map(v => (
                      <tr key={v.id}>
                        <td><span className="badge badge-scheduled" style={{ fontWeight: 'bold' }}>v{v.version}</span></td>
                        <td style={{ fontWeight: 600 }}>{v.title}</td>
                        <td><code>/{v.slug}</code></td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{v.changeLog || <em style={{ color: 'var(--text-muted)' }}>No description</em>}</td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{new Date(v.createdAt).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn-sm"
                            disabled={rollingBackId !== null}
                            onClick={() => handleRestoreVersion(v)}
                          >
                            {rollingBackId === v.id ? 'Rolling back...' : 'Rollback to here'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'diagnostics' && (
            <div>
              {diagnosticsLoading ? (
                <div className="loading">Running server-side diagnostics...</div>
              ) : !diagnostics ? (
                <div className="empty-state">No diagnostics information received.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Column 1: System Info & DB */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <h2 style={{ fontSize: '1.15rem', color: 'var(--text-h1)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>⚙️ Runtime &amp; Server</h2>
                      
                      {[
                        ['Node.js Version', diagnostics.runtime?.nodeVersion],
                        ['Platform', diagnostics.runtime?.platform],
                        ['Arch', diagnostics.runtime?.arch],
                        ['Process ID (PID)', diagnostics.runtime?.pid],
                        ['Uptime', `${diagnostics.runtime?.uptime} seconds`],
                        ['Memory Heap Used', diagnostics.runtime?.memory?.heapUsed],
                        ['Memory Heap Total', diagnostics.runtime?.memory?.heapTotal],
                        ['Memory RSS', diagnostics.runtime?.memory?.rss],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{label}</span>
                          <code style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{value}</code>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <h2 style={{ fontSize: '1.15rem', color: 'var(--text-h1)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>🗄️ Database</h2>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Prisma Database Connection</span>
                        <span className={`badge ${diagnostics.database?.status === 'connected' ? 'badge-published' : 'badge-danger'}`}>
                          {diagnostics.database?.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
                        </span>
                      </div>
                      {diagnostics.database?.status === 'connected' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Latency / Query response</span>
                          <code style={{ color: 'var(--success)' }}>{diagnostics.database?.responseMs} ms</code>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Environment configuration */}
                  <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}>
                    <h2 style={{ fontSize: '1.15rem', color: 'var(--text-h1)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>🔒 Environment Variables Checklist</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>Checks if critical key variables are set in `.env` (tokens/passwords are never printed for safety).</p>
                    
                    {Object.entries(diagnostics.environment || {}).map(([key, isSet]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <code style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{key}</code>
                        <span className={`badge ${isSet ? 'badge-published' : 'badge-draft'}`}>
                          {isSet ? '✓ Configured' : '✗ Missing'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal to add API keys */}
      {showKeyModal && (
        <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Generate New API Key</h2>
              <button className="modal-close" onClick={() => setShowKeyModal(false)}>×</button>
            </div>
            
            {newlyCreatedKey ? (
              <div style={{ padding: '1.5rem' }}>
                <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
                  🔑 <strong>Copy your key now!</strong> For security reasons, this key will not be displayed again.
                </div>
                <div style={{ background: 'var(--bg-base)', padding: '1rem', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                  <code style={{ flex: 1, wordBreak: 'break-all', color: 'var(--accent)', fontSize: '1rem', fontWeight: 'bold' }}>{newlyCreatedKey}</code>
                  <button
                    type="button"
                    className="btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedKey);
                      alert('Copied to clipboard!');
                    }}
                    style={{ marginLeft: '1rem' }}
                  >
                    Copy
                  </button>
                </div>
                <div className="modal-actions" style={{ padding: 0, border: 'none', background: 'none' }}>
                  <button className="btn-primary" onClick={() => setShowKeyModal(false)}>I have safely saved my key</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey}>
                <div className="form-group">
                  <label>Key Name / Description</label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. Next.js Production Frontend"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Permissions (Select allowed operations)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    {[
                      ['read:content', 'Read content (pages, blogs, service data)'],
                      ['write:content', 'Submit form submissions / track visitors'],
                      ['sync:routes', 'Auto-sync frontend routes discovery'],
                      ['admin:full', 'Full system access (highly sensitive)'],
                    ].map(([perm, label]) => (
                      <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input
                          type="checkbox"
                          checked={keyPermissions.includes(perm)}
                          onChange={() => handlePermissionToggle(perm)}
                        />
                        <span>
                          <strong>{perm}</strong> — {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="modal-actions" style={{ padding: '1.5rem 0 0', marginTop: '1.5rem', background: 'none' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowKeyModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={savingKey}>
                    {savingKey ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}