'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

const Icons = {
  pages: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  leads: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  services: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  websites: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="14" rx="2" ry="2"/>
      <line x1="6" y1="22" x2="18" y2="22"/>
      <line x1="12" y1="16" x2="12" y2="22"/>
    </svg>
  ),
  blogs: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  forms: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  team: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  testimonials: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  contacts: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  notifications: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  activity: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  tasks: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="9" x2="15" y2="9"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  ),
  system: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  globe: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  screen: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  media: (className = "w-5 h-5") => (
    <svg className={className} width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  warning: (className = "w-8 h-8") => (
    <svg className={className} width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
};

export default function DashboardOverview() {
  const [data, setData] = useState(null);
  const [connectedWebsites, setConnectedWebsites] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

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

  // Prepare KPI cards
  const kpiCards = [
    {
      label: 'Total Pages',
      value: stats.pages || 0,
      iconKey: 'pages',
      sub: `${stats.publishedPages || 0} published · ${stats.draftPages || 0} drafts`,
      color: 'blue',
      href: '/admin/pages',
    },
    {
      label: 'Total Leads',
      value: stats.leads || 0,
      iconKey: 'leads',
      sub: `${stats.newLeads || 0} new this week`,
      color: 'emerald',
      href: '/admin/leads',
    },
    {
      label: 'Services',
      value: stats.services || 0,
      iconKey: 'services',
      sub: `${stats.activeServices || 0} active services`,
      color: 'amber',
      href: '/admin/services',
    },
    {
      label: 'Connected Sites',
      value: stats.totalWebsites || 0,
      iconKey: 'websites',
      sub: `${stats.activeWebsites || 0} online · ${stats.totalConnectedRoutes || 0} routes`,
      color: 'indigo',
      href: '/admin/websites',
    },
    {
      label: 'Blog Posts',
      value: stats.blogs || 0,
      iconKey: 'blogs',
      sub: `${stats.media || 0} media files`,
      color: 'violet',
      href: '/admin/blogs',
    },
  ];

  return (
    <div className="dashboard-modern">
      {/* Page Header */}
      <div className="page-header-modern">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back! Here's what's happening with your business.
            {stats.unreadNotifications > 0 && (
              <span className="unread-badge">
                {stats.unreadNotifications} unread notifications
              </span>
            )}
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/pages" className="btn-primary">
            + New Page
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-stats">
        {kpiCards.map((kpi) => (
          <Link href={kpi.href} key={kpi.label} className="stat-card-modern">
            <div className="stat-card-header">
              <div className={`stat-card-icon stat-card-icon-${kpi.color}`}>
                <span>{Icons[kpi.iconKey]()}</span>
              </div>
            </div>
            <div className="stat-card-value">{kpi.value}</div>
            <div className="stat-card-label">{kpi.label}</div>
            <div className="stat-card-sub">{kpi.sub}</div>
          </Link>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Primary Metrics & Content Management */}
        <div className="col-8" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Widget 1: Traffic Overview (Analytics) */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Analytics Overview</div>
                <div className="chart-card-subtitle">Key metrics at a glance</div>
              </div>
            </div>
            <div className="analytics-metrics">
              <div className="analytics-metric">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' }}>
                  {Icons.pages()}
                </div>
                <div className="metric-info">
                  <div className="metric-value">{stats.pages}</div>
                  <div className="metric-label">Pages</div>
                </div>
              </div>
              <div className="analytics-metric">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {Icons.leads()}
                </div>
                <div className="metric-info">
                  <div className="metric-value">{stats.leads}</div>
                  <div className="metric-label">Leads</div>
                </div>
              </div>
              <div className="analytics-metric">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  {Icons.blogs()}
                </div>
                <div className="metric-info">
                  <div className="metric-value">{stats.blogs}</div>
                  <div className="metric-label">Blog Posts</div>
                </div>
              </div>
              <div className="analytics-metric">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  {Icons.forms()}
                </div>
                <div className="metric-info">
                  <div className="metric-value">{stats.forms}</div>
                  <div className="metric-label">Forms</div>
                </div>
              </div>
              <div className="analytics-metric">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
                  {Icons.team()}
                </div>
                <div className="metric-info">
                  <div className="metric-value">{stats.teamMembers}</div>
                  <div className="metric-label">Team</div>
                </div>
              </div>
              <div className="analytics-metric">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
                  {Icons.testimonials()}
                </div>
                <div className="metric-info">
                  <div className="metric-value">{stats.testimonials}</div>
                  <div className="metric-label">Testimonials</div>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 5.5: Connected Websites List */}
          <div className="activity-panel">
            <div className="activity-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="activity-panel-title">Connected Websites ({connectedWebsites.length})</div>
              <Link href="/admin/websites" className="view-all-link">
                Manage all →
              </Link>
            </div>
            <div className="activity-list-modern" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
              {connectedWebsites.length > 0 ? (
                connectedWebsites.map((site) => (
                  <div key={site.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ display: 'flex', color: 'var(--text-secondary)' }}>
                        {site.framework === 'wordpress' ? Icons.globe() : Icons.screen()}
                      </span>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.875rem', color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {site.name}
                          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                            {site.framework.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{site.domain}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 'bold', background: site.status === 'connected' ? 'var(--success-bg)' : 'var(--danger-bg)', color: site.status === 'connected' ? 'var(--success)' : 'var(--danger)', border: site.status === 'connected' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: site.status === 'connected' ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }} />
                        {site.status === 'connected' ? 'ONLINE' : 'ERROR'}
                      </span>
                      <Link href={`/dashboard/websites/${site.id}`} style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                        Sync →
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {Icons.globe()}
                  </div>
                  <div className="empty-title">No websites connected</div>
                  <div className="empty-desc">
                    <Link href="/admin/websites" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Connect a site</Link> to sync CMS content
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 8: Recent Leads */}
          <div className="submissions-table">
            <div className="submissions-table-header">
              <div className="submissions-table-title">Recent Leads</div>
              <Link href="/admin/leads" className="view-all-link">
                View all →
              </Link>
            </div>
            <div className="submissions-table-wrapper">
              {recentLeads && recentLeads.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>{lead.name}</td>
                        <td>{lead.email}</td>
                        <td>{lead.service}</td>
                        <td>{lead.date}</td>
                        <td>
                          <span className={`status-badge ${lead.status}`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {Icons.leads()}
                  </div>
                  <div className="empty-title">No leads yet</div>
                  <div className="empty-desc">Leads will appear once captured</div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 9: Recent Submissions */}
          <div className="submissions-table">
            <div className="submissions-table-header">
              <div className="submissions-table-title">Recent Submissions</div>
              <Link href="/admin/contacts" className="view-all-link">
                View all →
              </Link>
            </div>
            <div className="submissions-table-wrapper">
              {recentSubmissions && recentSubmissions.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>{submission.name}</td>
                        <td>{submission.email}</td>
                        <td>{submission.type}</td>
                        <td>{submission.date}</td>
                        <td>
                          <span className={`status-badge ${submission.status}`}>
                            {submission.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {Icons.forms()}
                  </div>
                  <div className="empty-title">No submissions yet</div>
                  <div className="empty-desc">Form submissions will appear here</div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 5.6: Website Connector Activity Log */}
          <div className="activity-panel">
            <div className="activity-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="activity-panel-title">Website Sync Log</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Last Sync: {stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleTimeString() : 'Never'}
              </span>
            </div>
            <div className="activity-list-modern" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
              {data.websiteLogs && data.websiteLogs.length > 0 ? (
                data.websiteLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <span style={{ display: 'flex', marginTop: '0.2rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.status === 'success' ? 'var(--success)' : 'var(--danger)', display: 'inline-block', boxShadow: log.status === 'success' ? '0 0 8px var(--success)' : '0 0 8px var(--danger)' }} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-h1)' }}>
                          {log.websiteName} · {log.action}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {log.timeAgo}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                        {log.details}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {Icons.activity()}
                  </div>
                  <div className="empty-title">No website logs yet</div>
                  <div className="empty-desc">Sync activity will be logged here.</div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Quick Tools, Status & Feeds */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Widget 2: Quick Actions Panel */}
          <div className="activity-panel">
            <div className="activity-panel-header">
              <div className="activity-panel-title">Quick Actions</div>
            </div>
            <div className="quick-actions-modern">
              <Link href="/admin/pages" className="quick-action-btn">
                <span className="quick-action-icon">{Icons.pages()}</span>
                <span>New Page</span>
              </Link>
              <Link href="/admin/services" className="quick-action-btn">
                <span className="quick-action-icon">{Icons.services()}</span>
                <span>New Service</span>
              </Link>
              <Link href="/admin/blogs" className="quick-action-btn">
                <span className="quick-action-icon">{Icons.blogs()}</span>
                <span>New Post</span>
              </Link>
              <Link href="/admin/leads" className="quick-action-btn">
                <span className="quick-action-icon">{Icons.leads()}</span>
                <span>View Leads</span>
              </Link>
              <Link href="/admin/contacts" className="quick-action-btn">
                <span className="quick-action-icon">{Icons.contacts()}</span>
                <span>Contacts</span>
              </Link>
              <Link href="/admin/forms" className="quick-action-btn">
                <span className="quick-action-icon">{Icons.forms()}</span>
                <span>Forms</span>
              </Link>
              <Link href="/admin/media" className="quick-action-btn">
                <span className="quick-action-icon">{Icons.media()}</span>
                <span>Media</span>
              </Link>
              <Link href="/admin/notifications" className="quick-action-btn">
                <span className="quick-action-icon">{Icons.notifications()}</span>
                <span>Notifications</span>
              </Link>
            </div>
          </div>

          {/* Widget 7: Profile Completion Status */}
          <div className="activity-panel">
            <div className="activity-panel-header">
              <div className="activity-panel-title">Profile Setup</div>
            </div>
            <div className="profile-completion">
              <div className="profile-completion-circle">
                <svg viewBox="0 0 120 120" className="profile-ring">
                  <circle cx="60" cy="60" r="52" className="profile-ring-bg" />
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="52" 
                    className="profile-ring-progress"
                    strokeDasharray={`${(profileCompletion?.percentage / 100) * 327} 327`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="profile-completion-text">
                  <span className="profile-completion-pct">{profileCompletion?.percentage || 0}%</span>
                  <span className="profile-completion-label">Complete</span>
                </div>
              </div>
              <div className="profile-steps">
                {Object.entries(profileCompletion?.steps || {}).map(([key, done]) => (
                  <div key={key} className={`profile-step ${done ? 'done' : ''}`}>
                    <span className="profile-step-icon" style={{ display: 'flex', color: done ? 'var(--success)' : 'var(--text-muted)' }}>
                      {done ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        </svg>
                      )}
                    </span>
                    <span className="profile-step-label">
                      {key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Widget 6: System Status & Alerts */}
          <div className="activity-panel">
            <div className="activity-panel-header">
              <div className="activity-panel-title">System Status</div>
            </div>
            <div className="system-status-list">
              <div className="system-status-item">
                <div className="system-status-dot success" />
                <div className="system-status-content">
                  <div className="system-status-label">System</div>
                  <div className="system-status-value">Operational</div>
                </div>
              </div>
              <div className="system-status-item">
                <div className={`system-status-dot ${systemStatus?.lastBackup ? 'success' : 'warning'}`} />
                <div className="system-status-content">
                  <div className="system-status-label">Last Backup</div>
                  <div className="system-status-value">
                    {systemStatus?.lastBackup ? systemStatus.lastBackup.date : 'Never'}
                  </div>
                </div>
              </div>
              <div className="system-status-item">
                <div className="system-status-dot success" />
                <div className="system-status-content">
                  <div className="system-status-label">Backups</div>
                  <div className="system-status-value">{stats.backups} total</div>
                </div>
              </div>
              <div className="system-status-item">
                <div className="system-status-dot success" />
                <div className="system-status-content">
                  <div className="system-status-label">Media Files</div>
                  <div className="system-status-value">{stats.media} files</div>
                </div>
              </div>
              <div className="system-status-item">
                <div className="system-status-dot success" />
                <div className="system-status-content">
                  <div className="system-status-label">Users</div>
                  <div className="system-status-value">{stats.users} registered</div>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 4: Notifications Center */}
          <div className="notifications-panel">
            <div className="activity-panel-header">
              <div className="activity-panel-title">Notifications</div>
              <Link href="/admin/notifications" className="view-all-link">
                View all →
              </Link>
            </div>
            <div className="notifications-list">
              {notifications && notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  >
                    <div className="notification-icon" style={{ display: 'flex', color: 'var(--text-secondary)' }}>
                      {notification.type === 'lead' ? Icons.leads() : 
                       notification.type === 'form' ? Icons.forms() : 
                       notification.type === 'system' ? Icons.system() : Icons.notifications()}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{notification.timeAgo}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {Icons.notifications()}
                  </div>
                  <div className="empty-title">No notifications</div>
                  <div className="empty-desc">You're all caught up!</div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 3: Recent Activity Feed */}
          <div className="activity-panel">
            <div className="activity-panel-header">
              <div className="activity-panel-title">Recent Activity</div>
              <Link href="/admin/activity" className="view-all-link">
                View all →
              </Link>
            </div>
            <div className="activity-list-modern">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="activity-item-modern">
                    <div className="activity-item-icon" style={{ display: 'flex', color: 'var(--text-secondary)' }}>
                      {activity.entity === 'page' ? Icons.pages() : 
                       activity.entity === 'lead' ? Icons.leads() : 
                       activity.entity === 'blog' ? Icons.blogs() : 
                       activity.entity === 'service' ? Icons.services() : Icons.forms()}
                    </div>
                    <div className="activity-item-content">
                      <div className="activity-item-title">{activity.action}</div>
                      <div className="activity-item-description">
                        {activity.details || activity.entity}
                      </div>
                      <div className="activity-item-time">
                        {activity.timeAgo} · {activity.user}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {Icons.activity()}
                  </div>
                  <div className="empty-title">No recent activity</div>
                  <div className="empty-desc">Activity will appear here as you work</div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 5: Upcoming Tasks / Schedule */}
          <div className="activity-panel">
            <div className="activity-panel-header">
              <div className="activity-panel-title">Upcoming Tasks</div>
              <Link href="/admin/pages" className="view-all-link">
                View all →
              </Link>
            </div>
            <div className="task-list">
              {upcomingTasks && upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="task-item-modern">
                    <div className={`task-status-dot ${task.status}`} />
                    <div className="task-item-content">
                      <div className="task-item-title">{task.title}</div>
                      <div className="task-item-meta">
                        <span className="task-item-status">{task.status}</span>
                        <span className="task-item-date">{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {Icons.tasks()}
                  </div>
                  <div className="empty-title">No upcoming tasks</div>
                  <div className="empty-desc">Schedule pages to appear here</div>
                </div>
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
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .page-subtitle {
          font-size: 0.875rem;
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
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-h1);
          line-height: 1;
          margin-bottom: 0.25rem;
          letter-spacing: -0.02em;
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