'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      
      // Fetch user info
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.user) setUser(userData.user);

      // Fetch dashboard stats
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(result.error || 'Failed to load data');
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
          {[...Array(4)].map((_, i) => (
            <div key={i} className="loading-skeleton">
              <div className="skeleton-line skeleton-line-sm" />
              <div className="skeleton-line skeleton-line-lg" />
              <div className="skeleton-line skeleton-line-md" />
            </div>
          ))}
        </div>
        <style jsx>{`
          .dashboard-loading { animation: fadeIn 0.3s ease-out; }
          .loading-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
          .loading-skeleton { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 1.5rem; }
          .skeleton-line { background: linear-gradient(90deg, var(--border-light) 25%, var(--border-strong) 50%, var(--border-light) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: var(--radius-sm); margin-bottom: 0.75rem; }
          .skeleton-line-sm { width: 60%; height: 14px; }
          .skeleton-line-lg { width: 90%; height: 32px; }
          .skeleton-line-md { width: 75%; height: 14px; }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
          <button onClick={fetchDashboardData} className="btn-primary">Retry</button>
        </div>
        <style jsx>{`
          .dashboard-error { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
          .error-card { text-align: center; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); padding: 3rem; max-width: 480px; }
          .error-icon { font-size: 3rem; margin-bottom: 1rem; }
          .error-card h2 { font-size: 1.5rem; font-weight: 700; color: var(--text-h1); margin-bottom: 0.75rem; }
          .error-card p { color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6; }
        `}</style>
      </div>
    );
  }

  const { stats, recentActivity, notifications } = data || {};

  return (
    <div className="user-dashboard">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div>
          <h1 className="page-title">
            Welcome{user?.name ? `, ${user.name}` : ' Back'}!
          </h1>
          <p className="page-subtitle">
            Here's your personalized overview. Manage your content and stay updated.
          </p>
        </div>
      </div>

      {/* Essential KPI Cards */}
      <div className="dashboard-stats">
        <div className="stat-card-modern">
          <div className="stat-card-header">
            <div className="stat-card-icon stat-card-icon-blue">
              <span>📄</span>
            </div>
          </div>
          <div className="stat-card-value">{stats?.pages || 0}</div>
          <div className="stat-card-label">Published Pages</div>
          <div className="stat-card-sub">{stats?.publishedPages || 0} published · {stats?.draftPages || 0} drafts</div>
        </div>
        <div className="stat-card-modern">
          <div className="stat-card-header">
            <div className="stat-card-icon stat-card-icon-emerald">
              <span>📝</span>
            </div>
          </div>
          <div className="stat-card-value">{stats?.blogs || 0}</div>
          <div className="stat-card-label">Blog Posts</div>
          <div className="stat-card-sub">Your published articles</div>
        </div>
        <div className="stat-card-modern">
          <div className="stat-card-header">
            <div className="stat-card-icon stat-card-icon-amber">
              <span>🛠️</span>
            </div>
          </div>
          <div className="stat-card-value">{stats?.services || 0}</div>
          <div className="stat-card-label">Services</div>
          <div className="stat-card-sub">{stats?.activeServices || 0} active services</div>
        </div>
        <div className="stat-card-modern">
          <div className="stat-card-header">
            <div className="stat-card-icon stat-card-icon-violet">
              <span>🔔</span>
            </div>
          </div>
          <div className="stat-card-value">{stats?.unreadNotifications || 0}</div>
          <div className="stat-card-label">Notifications</div>
          <div className="stat-card-sub">Unread updates</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-grid">
        <div className="col-4">
          <div className="activity-panel">
            <div className="activity-panel-header">
              <div className="activity-panel-title">Quick Actions</div>
            </div>
            <div className="quick-actions-modern">
              <Link href="/admin/pages" className="quick-action-btn">
                <span className="quick-action-icon">📄</span>
                <span>View Pages</span>
              </Link>
              <Link href="/admin/blog" className="quick-action-btn">
                <span className="quick-action-icon">📝</span>
                <span>View Blog</span>
              </Link>
              <Link href="/admin/services" className="quick-action-btn">
                <span className="quick-action-icon">🛠️</span>
                <span>View Services</span>
              </Link>
              <Link href="/admin/notifications" className="quick-action-btn">
                <span className="quick-action-icon">🔔</span>
                <span>Notifications</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-8">
          <div className="activity-panel">
            <div className="activity-panel-header">
              <div className="activity-panel-title">Recent Activity</div>
              <Link href="/admin/activity" className="view-all-link">View all →</Link>
            </div>
            <div className="activity-list-modern">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="activity-item-modern">
                    <div className="activity-item-icon">
                      {activity.entity === 'page' ? '📄' : 
                       activity.entity === 'lead' ? '💼' : 
                       activity.entity === 'blog' ? '📝' : 
                       activity.entity === 'service' ? '🛠️' : '📋'}
                    </div>
                    <div className="activity-item-content">
                      <div className="activity-item-title">{activity.action}</div>
                      <div className="activity-item-description">{activity.details || activity.entity}</div>
                      <div className="activity-item-time">{activity.timeAgo} · {activity.user}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No recent activity</div>
                  <div className="empty-desc">Activity will appear here as you work</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="col-12">
          <div className="notifications-panel">
            <div className="activity-panel-header">
              <div className="activity-panel-title">Notifications</div>
              <Link href="/admin/notifications" className="view-all-link">View all →</Link>
            </div>
            <div className="notifications-list">
              {notifications && notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className={`notification-item ${!notification.isRead ? 'unread' : ''}`}>
                    <div className="notification-icon">
                      {notification.type === 'lead' ? '💼' : 
                       notification.type === 'form' ? '📋' : 
                       notification.type === 'system' ? '⚙️' : '🔔'}
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
                  <div className="empty-icon">🔔</div>
                  <div className="empty-title">No notifications</div>
                  <div className="empty-desc">You're all caught up!</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .welcome-header {
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
          font-size: 0.875rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}