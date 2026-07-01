'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function DashboardOverview() {
  const [data, setData] = useState(null);
  const [connectedWebsites, setConnectedWebsites] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);
  const [activeFeedTab, setActiveFeedTab] = useState('activity');
  const [activeLeadTab, setActiveLeadTab] = useState('leads');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      const [statsRes, websitesRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/websites')
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats');
      if (!websitesRes.ok) throw new Error('Failed to fetch websites list');

      const statsJson = await statsRes.json();
      const websitesJson = await websitesRes.json();

      if (statsJson.success && websitesJson.success) {
        setData(statsJson.data);
        setConnectedWebsites(websitesJson.data || []);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(statsJson.error || websitesJson.error || 'Failed to load data');
      }
    } catch (err) {
      setError(err.message);
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Loading State
  if (loadingState === LOADING_STATES.LOADING) {
    return (
      <div className="dashboard-loading">
        <div className="loading-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="loading-skeleton">
              <div className="skeleton-line skeleton-line-sm" />
              <div className="skeleton-line skeleton-line-lg" />
              <div className="skeleton-line skeleton-line-md" />
            </div>
          ))}
        </div>
        <style jsx>{`
          .dashboard-loading {
            animation: fadeIn 0.3s ease-out;
          }
          .loading-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
          }
          .loading-skeleton {
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            border-radius: var(--radius-md);
            padding: 1.5rem;
          }
          .skeleton-line {
            background: linear-gradient(90deg, var(--border-light) 25%, var(--border-strong) 50%, var(--border-light) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: var(--radius-sm);
            margin-bottom: 0.75rem;
          }
          .skeleton-line-sm { width: 60%; height: 14px; }
          .skeleton-line-lg { width: 90%; height: 32px; }
          .skeleton-line-md { width: 75%; height: 14px; }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // Error State
  if (loadingState === LOADING_STATES.ERROR) {
    return (
      <div className="dashboard-error">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>Failed to Load Dashboard</h2>
          <p>{error || 'An unexpected error occurred. Please try again.'}</p>
          <button onClick={fetchDashboardData} className="btn-primary">
            Retry
          </button>
        </div>
        <style jsx>{`
          .dashboard-error {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
          }
          .error-card {
            text-align: center;
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            border-radius: var(--radius-lg);
            padding: 3rem;
            max-width: 480px;
          }
          .error-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          .error-card h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-h1);
            margin-bottom: 0.75rem;
          }
          .error-card p {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
        `}</style>
      </div>
    );
  }

  const { stats, recentActivity, notifications, recentLeads, recentSubmissions, upcomingTasks, systemStatus, profileCompletion } = data;

  // Prepare KPI cards (exclusively CMS & website management)
  const kpiCards = [
    {
      label: 'Total Pages',
      value: stats.pages || 0,
      icon: '📄',
      sub: `${stats.publishedPages || 0} published · ${stats.draftPages || 0} drafts`,
      color: 'blue',
      href: '/admin/pages',
    },
    {
      label: 'Blog Posts',
      value: stats.blogs || 0,
      icon: '📝',
      sub: `${stats.media || 0} media assets in library`,
      color: 'emerald',
      href: '/admin/blogs',
    },
    {
      label: 'Services',
      value: stats.services || 0,
      icon: '🛠️',
      sub: `${stats.activeServices || 0} active services`,
      color: 'amber',
      href: '/admin/services',
    },
    {
      label: 'Connected Sites',
      value: stats.totalWebsites || 0,
      icon: '🔌',
      sub: `${stats.activeWebsites || 0} online · ${stats.totalConnectedRoutes || 0} routes`,
      color: 'indigo',
      href: '/admin/websites',
    },
  ];

  return (
    <div className="dashboard-modern" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header-modern" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>CMS & Content Management Overview</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Overview of websites, route indexing, blogs, page states, and sync integrations.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/pages" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            ➕ Create New Page
          </Link>
        </div>
      </div>

      {/* KPI Cards Row (Grid of 4) */}
      <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {kpiCards.map((kpi) => (
          <Link href={kpi.href} key={kpi.label} className="stat-card-modern" style={{ textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', transition: 'var(--transition)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
              <span style={{ fontSize: '1.25rem' }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', lineHeight: 1.2 }}>{kpi.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{kpi.sub}</div>
          </Link>
        ))}
      </div>

      {/* Main Content Workspace Grid */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Analytics & Submissions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Widget 1: Analytics Metrics */}
          <div className="chart-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📊 CMS Assets Metrics</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>Key database counts at a glance</p>
            </div>
            <div className="analytics-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div className="analytics-metric" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1.25rem' }}>📄</span>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h1)' }}>{stats.pages}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pages</div>
                </div>
              </div>
              <div className="analytics-metric" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1.25rem' }}>📝</span>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h1)' }}>{stats.blogs}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Blogs</div>
                </div>
              </div>
              <div className="analytics-metric" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1.25rem' }}>🛠️</span>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-h1)' }}>{stats.services}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Services</div>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Recent Sync Logs */}
          <div className="submissions-table" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>🌐 Connected Websites</h3>
              <Link href="/admin/websites" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                Manage Sites &rarr;
              </Link>
            </div>
            
            <div className="submissions-table-wrapper" style={{ overflowX: 'auto' }}>
              {connectedWebsites && connectedWebsites.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem 0' }}>Site Name</th>
                      <th style={{ padding: '0.5rem 0' }}>Domain</th>
                      <th style={{ padding: '0.5rem 0' }}>Framework</th>
                      <th style={{ padding: '0.5rem 0' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connectedWebsites.slice(0, 5).map((site) => (
                      <tr key={site.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: 'bold' }}>{site.name}</td>
                        <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{site.domain}</td>
                        <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{site.framework}</td>
                        <td style={{ padding: '0.75rem 0' }}>
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: site.status === 'connected' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: site.status === 'connected' ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                            {site.status === 'connected' ? 'ACTIVE' : 'OFFLINE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No connected websites found.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Actions & Connected Websites */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Widget 3: Quick Actions */}
          <div className="activity-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-h1)', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ Quick Tools</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <Link href="/admin/pages" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.25rem' }}>📄</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>Pages</span>
              </Link>
              <Link href="/admin/services" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.25rem' }}>🛠️</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>Services</span>
              </Link>
              <Link href="/admin/blogs" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.25rem' }}>📝</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>Blogs</span>
              </Link>
              <Link href="/admin/settings" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.25rem' }}>⚙️</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>Settings</span>
              </Link>
            </div>
          </div>

          {/* Widget 4: Connected Frontends */}
          <div className="activity-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🌐 Websites ({connectedWebsites.length})</h3>
              <Link href="/admin/websites" style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>Manage</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {connectedWebsites.slice(0, 3).map(site => (
                <div key={site.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-h1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.domain}</div>
                  </div>
                  <span style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem', borderRadius: '9999px', background: site.status === 'connected' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: site.status === 'connected' ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                    {site.status === 'connected' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 5: Recent Activity log */}
          <div className="activity-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ Sync Activity</h3>
              <Link href="/admin/activity" style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>Logs</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 3).map((activity) => (
                  <div key={activity.id} style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '1rem' }}>⚡</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.action}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{activity.timeAgo} • {activity.user}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No logs yet.</div>
              )}
            </div>
          </div>

        </div>

      </div>

      <style jsx>{`
        .page-header-modern {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .page-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .unread-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.625rem;
          background: var(--danger-bg);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-pill);
          font-size: 0.75rem;
          font-weight: 700;
          color: #fca5a5;
        }

        .page-actions {
          display: flex;
          gap: 0.75rem;
        }

        .view-all-link {
          font-size: 0.8125rem;
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .view-all-link:hover {
          color: var(--primary-hover);
          text-decoration: underline;
        }

        .stat-card-modern {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          cursor: pointer;
        }

        .stat-card-value {
          font-size: 1.5rem;
          font-weight: 750;
          color: var(--text-h1);
          line-height: 1;
          margin-bottom: 0.25rem;
          letter-spacing: -0.01em;
        }

        .stat-card-label {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .stat-card-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .stat-card-trend {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.625rem;
          border-radius: var(--radius-pill);
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .stat-card-trend.up { background: var(--success-bg); color: #34d399; }
        .stat-card-trend.down { background: var(--danger-bg); color: #f87171; }

        /* Analytics Metrics */
        .analytics-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
          padding: 0.5rem 0;
        }

        .analytics-metric {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          transition: var(--transition);
        }

        .analytics-metric:hover {
          border-color: var(--border-strong);
          transform: translateY(-2px);
        }

        .metric-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          color: #fff;
          flex-shrink: 0;
        }

        .metric-info {
          min-width: 0;
        }

        .metric-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-h1);
          line-height: 1;
        }

        .metric-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
          margin-top: 0.125rem;
        }

        /* Task List */
        .task-list {
          display: flex;
          flex-direction: column;
        }

        .task-item-modern {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: var(--radius-md);
          transition: var(--transition);
        }

        .task-item-modern:not(:last-child) {
          border-bottom: 1px solid var(--border-light);
        }

        .task-item-modern:hover {
          background-color: var(--bg-card-hover);
        }

        .task-status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .task-status-dot.published {
          background: var(--success);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }

        .task-status-dot.draft {
          background: var(--warning);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }

        .task-status-dot.scheduled {
          background: var(--info);
          box-shadow: 0 0 8px rgba(14, 165, 233, 0.4);
        }

        .task-item-content {
          flex: 1;
          min-width: 0;
        }

        .task-item-title {
          font-weight: 700;
          color: var(--text-h1);
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .task-item-meta {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .task-item-status {
          font-size: 0.75rem;
          color: var(--primary);
          font-weight: 600;
          text-transform: capitalize;
        }

        .task-item-date {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* System Status */
        .system-status-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .system-status-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
        }

        .system-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .system-status-dot.success {
          background: var(--success);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }

        .system-status-dot.warning {
          background: var(--warning);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }

        .system-status-content {
          flex: 1;
        }

        .system-status-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .system-status-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-h1);
        }

        /* Profile Completion */
        .profile-completion {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .profile-completion-circle {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .profile-ring {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .profile-ring-bg {
          fill: none;
          stroke: var(--border-strong);
          stroke-width: 8;
        }

        .profile-ring-progress {
          fill: none;
          stroke: var(--gradient-primary);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dasharray 0.5s ease;
        }

        .profile-completion-text {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .profile-completion-pct {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-h1);
          line-height: 1;
        }

        .profile-completion-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .profile-steps {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .profile-step {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .profile-step.done {
          color: var(--success);
        }

        .profile-step-icon {
          font-size: 0.875rem;
        }

        /* Empty States */
        .empty-state {
          text-align: center;
          padding: 2.5rem 1rem;
          color: var(--text-muted);
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
        }

        .empty-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .empty-desc {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        /* Notifications List */
        .notifications-list {
          display: flex;
          flex-direction: column;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .dashboard-grid .col-8,
          .dashboard-grid .col-4,
          .dashboard-grid .col-6,
          .dashboard-grid .col-3 {
            grid-column: span 12;
          }
        }

        @media (max-width: 768px) {
          .page-header-modern {
            flex-direction: column;
            align-items: flex-start;
          }
          .dashboard-stats {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          }
          .analytics-metrics {
            grid-template-columns: repeat(2, 1fr);
          }
          .quick-actions-modern {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
            .page-title {
              font-size: 1.5rem;
            }

            .dashboard-stats {
              grid-template-columns: 1fr;
            }

            .analytics-metrics {
              grid-template-columns: 1fr;
            }

            .quick-actions-modern {
              grid-template-columns: 1fr;
            }
          }
          `}</style>
          </div>
          );
          }