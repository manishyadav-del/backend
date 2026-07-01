'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function AnalyticsPage() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  
  // Settings Tab states
  const [analyticsSettings, setAnalyticsSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Dashboard Overview Tab states
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'settings'

  // Fetch projects list
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const projList = data.projects || [];
        setProjects(projList);
        if (projList.length > 0) {
          setProjectId(projList[0].id);
        }
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
      });
  }, []);

  // Fetch settings & stats when projectId changes
  useEffect(() => {
    if (!projectId) return;

    // Fetch integration settings
    fetch(`/api/global-settings?apiKey=demo`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAnalyticsSettings(data.data.analytics || {});
        }
      })
      .catch(err => console.error('Error loading analytics settings:', err));

    // Fetch visitor stats
    loadVisitorStats();
  }, [projectId]);

  const loadVisitorStats = async () => {
    try {
      setLoadingStats(true);
      setStatsError('');
      const res = await fetch(`/api/visitors/stats?projectId=${projectId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStatsData(data);
      } else {
        setStatsError(data.error || 'Failed to load stats data');
      }
    } catch (err) {
      setStatsError('Error connecting to stats API');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage('');
    setSettingsError('');

    try {
      const formData = new FormData(e.target);
      const analyticsData = {
        googleAnalytics: formData.get('gaId'),
        tagManager: formData.get('gtmId'),
        clarity: formData.get('clarityId'),
        metaPixel: formData.get('metaPixelId'),
        linkedinTag: formData.get('linkedinTagId'),
        searchConsole: formData.get('searchConsoleId'),
      };

      const res = await fetch('/api/global-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analytics: JSON.stringify(analyticsData) }),
      });

      if (!res.ok) {
        setSettingsError('Failed to save analytics settings');
        return;
      }

      setSettingsMessage('Analytics settings saved successfully');
      Swal.fire('Saved!', 'External tracking tags updated successfully.', 'success');
    } catch (err) {
      setSettingsError('Something went wrong');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, background: 'linear-gradient(to right, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.5rem 0' }}>
            Website Analytics Dashboard
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Monitor real-time visitors, page views, bounce rate, and platform demographics.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Website:</label>
          <select 
            value={projectId} 
            onChange={(e) => setProjectId(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #e5e7eb)',
              background: 'var(--bg-card, #fff)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #e5e7eb)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.75rem 0.5rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'overview' ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === 'overview' ? '#3b82f6' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          📊 Overview & Traffic
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '0.75rem 0.5rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'settings' ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === 'settings' ? '#3b82f6' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          ⚙️ Tracking Code Settings
        </button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {statsError && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{statsError}</div>}

          {loadingStats ? (
            <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>Collecting analytics insights...</div>
          ) : !statsData ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '3rem' }}>No session data recorded yet. Ensure the script tracker is connected.</div>
          ) : (
            <div>
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Visitors Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Unique Visitors</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 700 }}>{statsData.stats.totalVisitors}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Based on unique IP logs</div>
                </div>

                {/* Sessions Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0.03) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Sessions</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 700 }}>{statsData.stats.totalSessions}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Aggregated visitor heartbeats</div>
                </div>

                {/* Page Views Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Page Views</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 700 }}>{statsData.stats.totalPageViews}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Total clicked links counted</div>
                </div>

                {/* Bounce Rate Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(236, 72, 153, 0.03) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#ec4899', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Bounce Rate</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 700 }}>{statsData.stats.bounceRate}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Single-page session ratio</div>
                </div>
              </div>

              {/* Aggregation Charts & Demographics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* Traffic Sources */}
                <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', padding: '1.5rem', borderRadius: '10px' }}>
                  <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 600, fontSize: '1.05rem', color: '#3b82f6' }}>Traffic Sources</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {statsData.trafficSources.map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 500 }}>{item.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.count} sessions</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-base, #f3f4f6)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            background: '#3b82f6',
                            width: `${(item.count / statsData.stats.totalSessions) * 100}%`,
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Country Analytics */}
                <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', padding: '1.5rem', borderRadius: '10px' }}>
                  <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 600, fontSize: '1.05rem', color: '#06b6d4' }}>Country Demographics</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {statsData.countryAnalytics.map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 500 }}>📍 {item.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.count} sessions</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-base, #f3f4f6)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            background: '#06b6d4',
                            width: `${(item.count / statsData.stats.totalSessions) * 100}%`,
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device & Browser */}
                <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', padding: '1.5rem', borderRadius: '10px' }}>
                  <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 600, fontSize: '1.05rem', color: '#8b5cf6' }}>Devices & Browsers</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Devices */}
                    <div>
                      <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Device Type</h4>
                      {statsData.deviceAnalytics.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '0.6rem', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.name}</span>
                            <strong>{item.count}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Browsers */}
                    <div>
                      <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Browser</h4>
                      {statsData.browserAnalytics.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '0.6rem', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.name}</span>
                            <strong>{item.count}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pages Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                {/* Landing Pages */}
                <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', padding: '1.5rem', borderRadius: '10px' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontWeight: 600, fontSize: '1.05rem' }}>🚪 Top Landing Pages</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Page Path</th>
                          <th style={{ textAlign: 'right' }}>Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.landingPages.map((item, idx) => (
                          <tr key={idx}>
                            <td><code>{item.name}</code></td>
                            <td style={{ textAlign: 'right' }}><strong>{item.count}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Exit Pages */}
                <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)', padding: '1.5rem', borderRadius: '10px' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontWeight: 600, fontSize: '1.05rem' }}>🏃 Top Exit Pages</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Page Path</th>
                          <th style={{ textAlign: 'right' }}>Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.exitPages.map((item, idx) => (
                          <tr key={idx}>
                            <td><code>{item.name}</code></td>
                            <td style={{ textAlign: 'right' }}><strong>{item.count}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab Content */}
      {activeTab === 'settings' && (
        <div style={{
          background: 'var(--bg-card, #fff)',
          padding: '2rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color, #e5e7eb)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          maxWidth: '800px'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>External Script Tracking Configuration</h2>

          {settingsMessage && <div className="success-message" style={{ padding: '0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{settingsMessage}</div>}
          {settingsError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{settingsError}</div>}

          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>Google Analytics ID</label>
                <input
                  type="text"
                  name="gaId"
                  defaultValue={analyticsSettings?.googleAnalytics || ''}
                  placeholder="G-XXXXXXXXXX"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color, #e5e7eb)', background: 'var(--bg-input, #fff)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>Google Tag Manager ID</label>
                <input
                  type="text"
                  name="gtmId"
                  defaultValue={analyticsSettings?.tagManager || ''}
                  placeholder="GTM-XXXXXXX"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color, #e5e7eb)', background: 'var(--bg-input, #fff)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>Microsoft Clarity ID</label>
                <input
                  type="text"
                  name="clarityId"
                  defaultValue={analyticsSettings?.clarity || ''}
                  placeholder="XXXXXXX"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color, #e5e7eb)', background: 'var(--bg-input, #fff)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>Meta Pixel ID</label>
                <input
                  type="text"
                  name="metaPixelId"
                  defaultValue={analyticsSettings?.metaPixel || ''}
                  placeholder="XXXXXXXXXXXXXXX"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color, #e5e7eb)', background: 'var(--bg-input, #fff)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>LinkedIn Insight Tag ID</label>
                <input
                  type="text"
                  name="linkedinTagId"
                  defaultValue={analyticsSettings?.linkedinTag || ''}
                  placeholder="XXXXXXX"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color, #e5e7eb)', background: 'var(--bg-input, #fff)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>Google Search Console ID</label>
                <input
                  type="text"
                  name="searchConsoleId"
                  defaultValue={analyticsSettings?.searchConsole || ''}
                  placeholder="XXXXXXXXXX"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color, #e5e7eb)', background: 'var(--bg-input, #fff)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary" disabled={savingSettings} style={{ padding: '0.6rem 1.5rem' }}>
              {savingSettings ? 'Saving Settings...' : '💾 Save Settings'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}