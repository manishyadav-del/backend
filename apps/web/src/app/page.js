'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // Check if user is authenticated
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) setIsAuthenticated(true);
      })
      .catch(() => {});

    fetchDashboardStats();
  }, []);

  const features = [
    {
      icon: '📄',
      title: 'Page Builder',
      description: 'Create and manage stunning pages with our intuitive drag-and-drop builder.',
      link: '/dashboard/pages',
    },
    {
      icon: '🛠️',
      title: 'Service Management',
      description: 'Showcase your services and offerings with beautiful customizable cards.',
      link: '/dashboard/services',
    },
    {
      icon: '📝',
      title: 'Blog Engine',
      description: 'Publish and manage blog posts with categories, SEO, and scheduling.',
      link: '/dashboard/blog',
    },
    {
      icon: '🎯',
      title: 'Lead Generation',
      description: 'Capture and manage leads with forms, CTAs, and tracking analytics.',
      link: '/dashboard/leads',
    },
    {
      icon: '🔍',
      title: 'SEO Tools',
      description: 'Optimize your content with meta tags, sitemaps, and performance insights.',
      link: '/dashboard/seo',
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Track visitors, conversions, and growth with real-time analytics dashboard.',
      link: '/dashboard/analytics',
    },
  ];

  if (loading) {
    return (
      <div className="home-loading">
        <div className="home-spinner" />
        <p>Loading your dashboard...</p>
        <style jsx>{`
          .home-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--bg-base);
            color: var(--text-muted);
            gap: 1rem;
          }
          .home-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-strong);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* Navigation */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <div className="home-logo">
            <div className="home-logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <span className="home-logo-text">GlobalBackend</span>
          </div>
          <div className="home-nav-links">
            <a href="#features" className="home-nav-link">Features</a>
            <a href="#stats" className="home-nav-link">Stats</a>
            <Link href={isAuthenticated ? '/dashboard' : '/login'} className="home-cta-btn">
              {isAuthenticated ? 'Dashboard' : 'Get Started'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-bg">
          <div className="home-hero-orb home-hero-orb-1" />
          <div className="home-hero-orb home-hero-orb-2" />
        </div>
        <div className="home-hero-content">
          <div className="home-hero-badge">🚀 All-in-One Platform</div>
          <h1 className="home-hero-title">
            Manage Your Digital
            <span className="home-gradient-text"> Presence</span>
            {' '}From One Dashboard
          </h1>
          <p className="home-hero-subtitle">
            Build, manage, and grow your online presence with our comprehensive suite of tools.
            From pages and blogs to SEO and analytics — everything you need in one place.
          </p>
          <div className="home-hero-actions">
            <Link href={isAuthenticated ? '/dashboard' : '/login'} className="home-primary-btn">
              <span>Get Started Free</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <a href="#features" className="home-secondary-btn">
              Learn More
            </a>
          </div>

          {/* Hero Stats */}
          {stats && (
            <div className="home-hero-stats">
              <div className="home-hero-stat">
                <span className="home-hero-stat-value">{stats.stats.pages}</span>
                <span className="home-hero-stat-label">Pages</span>
              </div>
              <div className="home-hero-stat">
                <span className="home-hero-stat-value">{stats.stats.leads}</span>
                <span className="home-hero-stat-label">Leads</span>
              </div>
              <div className="home-hero-stat">
                <span className="home-hero-stat-value">{stats.stats.services}</span>
                <span className="home-hero-stat-label">Services</span>
              </div>
              <div className="home-hero-stat">
                <span className="home-hero-stat-value">{stats.stats.blogs}</span>
                <span className="home-hero-stat-label">Blog Posts</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats Section */}
      <section id="stats" className="home-section">
        <div className="home-section-header">
          <h2>Platform Overview</h2>
          <p>Real-time metrics from your dashboard</p>
        </div>
        <div className="home-stats-grid">
          {stats ? (
            <>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' }}>
                  📄
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.pages}</div>
                  <div className="home-stat-name">Total Pages</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.publishedPages} published · {stats.stats.draftPages} drafts
                </div>
              </div>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  💼
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.leads}</div>
                  <div className="home-stat-name">Total Leads</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.newLeads} new this week
                </div>
              </div>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  🛠️
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.services}</div>
                  <div className="home-stat-name">Services</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.activeServices} active services
                </div>
              </div>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  📝
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.blogs}</div>
                  <div className="home-stat-name">Blog Posts</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.media} media files
                </div>
              </div>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
                  👥
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.teamMembers}</div>
                  <div className="home-stat-name">Team Members</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.testimonials} testimonials
                </div>
              </div>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
                  🔔
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.notifications}</div>
                  <div className="home-stat-name">Notifications</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.unreadNotifications} unread
                </div>
              </div>
            </>
          ) : (
            <div className="home-empty">Unable to load stats. Please login to view metrics.</div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="home-section">
        <div className="home-section-header">
          <h2>Everything You Need</h2>
          <p>Comprehensive tools to manage your entire digital presence</p>
        </div>
        <div className="home-features-grid">
          {features.map((feature) => (
            <Link href={feature.link} key={feature.title} className="home-feature-card">
              <div className="home-feature-icon">{feature.icon}</div>
              <h3 className="home-feature-title">{feature.title}</h3>
              <p className="home-feature-desc">{feature.description}</p>
              <div className="home-feature-link">
                <span>Learn more</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity & Notifications */}
      {stats && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Recent Activity</h2>
            <p>Latest updates from your platform</p>
          </div>
          <div className="home-activity-grid">
            {/* Recent Activity */}
            <div className="home-panel">
              <div className="home-panel-header">
                <h3>Activity Feed</h3>
                <Link href="/dashboard/activity" className="home-view-all">View all →</Link>
              </div>
              <div className="home-panel-body">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="home-activity-item">
                      <div className="home-activity-dot" />
                      <div className="home-activity-content">
                        <div className="home-activity-action">{activity.action}</div>
                        <div className="home-activity-detail">
                          {activity.details || activity.entity}
                        </div>
                        <div className="home-activity-time">{activity.timeAgo}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="home-empty-small">No recent activity</div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="home-panel">
              <div className="home-panel-header">
                <h3>Notifications</h3>
                <Link href="/dashboard/notifications" className="home-view-all">View all →</Link>
              </div>
              <div className="home-panel-body">
                {stats.notifications.length > 0 ? (
                  stats.notifications.map((notif) => (
                    <div key={notif.id} className={`home-notif-item ${!notif.isRead ? 'unread' : ''}`}>
                      <div className="home-notif-icon">
                        {notif.type === 'lead' ? '💼' : notif.type === 'form' ? '📋' : notif.type === 'system' ? '⚙️' : '🔔'}
                      </div>
                      <div className="home-notif-content">
                        <div className="home-notif-title">{notif.title}</div>
                        <div className="home-notif-msg">{notif.message}</div>
                        <div className="home-notif-time">{notif.timeAgo}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="home-empty-small">No notifications</div>
                )}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="home-panel">
              <div className="home-panel-header">
                <h3>Upcoming Tasks</h3>
                <Link href="/dashboard/pages" className="home-view-all">View all →</Link>
              </div>
              <div className="home-panel-body">
                {stats.upcomingTasks.length > 0 ? (
                  stats.upcomingTasks.map((task) => (
                    <div key={task.id} className="home-task-item">
                      <div className="home-task-status">
                        <div className={`home-task-dot ${task.status}`} />
                      </div>
                      <div className="home-task-content">
                        <div className="home-task-title">{task.title}</div>
                        <div className="home-task-date">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          {task.dueDate}
                        </div>
                      </div>
                      <span className="home-task-badge">{task.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="home-empty-small">No upcoming tasks</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions / CTA */}
      <section className="home-cta-section">
        <div className="home-cta-card">
          <h2>Ready to Take Control?</h2>
          <p>Start managing your entire digital presence from one powerful dashboard.</p>
          <div className="home-cta-actions">
            <Link href={isAuthenticated ? '/dashboard' : '/login'} className="home-primary-btn home-primary-btn-lg">
              {isAuthenticated ? 'Go to Dashboard' : 'Login to Dashboard'}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <div className="home-logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <span>GlobalBackend</span>
          </div>
          <div className="home-footer-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/login">Login</Link>
          </div>
          <div className="home-footer-copy">
            © {new Date().getFullYear()} GlobalBackend. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* Navigation */
        .home-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(9, 9, 11, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-light);
        }
        .home-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .home-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .home-logo-icon {
          width: 36px;
          height: 36px;
          background: var(--gradient-primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: var(--shadow-glow);
        }
        .home-logo-text {
          font-size: 1.25rem;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .home-nav-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .home-nav-link {
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.9rem;
          transition: var(--transition);
          text-decoration: none;
        }
        .home-nav-link:hover {
          color: var(--text-primary);
        }
        .home-cta-btn {
          padding: 0.5rem 1.25rem;
          background: var(--gradient-primary);
          color: #fff;
          border-radius: var(--radius-pill);
          font-weight: 700;
          font-size: 0.875rem;
          text-decoration: none;
          transition: var(--transition);
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.25);
        }
        .home-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow), 0 8px 25px rgba(14, 165, 233, 0.4);
        }

        /* Hero Section */
        .home-hero {
          position: relative;
          min-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 6rem 1.5rem 4rem;
        }
        .home-hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .home-hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
        }
        .home-hero-orb-1 {
          width: 600px;
          height: 600px;
          background: var(--primary);
          top: -200px;
          right: -200px;
          animation: floatSlow 20s infinite alternate;
        }
        .home-hero-orb-2 {
          width: 500px;
          height: 500px;
          background: var(--secondary);
          bottom: -250px;
          left: -150px;
          animation: floatSlow 25s infinite alternate-reverse;
        }
        @keyframes floatSlow {
          from { transform: translate(0, 0); }
          to { transform: translate(50px, -50px); }
        }
        .home-hero-content {
          position: relative;
          max-width: 800px;
          text-align: center;
          z-index: 10;
        }
        .home-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(14, 165, 233, 0.1);
          border: 1px solid rgba(14, 165, 233, 0.2);
          border-radius: var(--radius-pill);
          color: var(--primary);
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }
        .home-hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--text-h1);
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.03em;
        }
        .home-gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .home-hero-subtitle {
          font-size: 1.15rem;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto 2rem;
        }
        .home-hero-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }
        .home-primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          background: var(--gradient-primary);
          color: #fff;
          border-radius: var(--radius-pill);
          font-weight: 700;
          font-size: 1rem;
          text-decoration: none;
          transition: var(--transition);
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.25);
        }
        .home-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow), 0 8px 25px rgba(14, 165, 233, 0.4);
        }
        .home-primary-btn-lg {
          padding: 1rem 2.5rem;
          font-size: 1.125rem;
        }
        .home-secondary-btn {
          padding: 0.875rem 2rem;
          background: var(--bg-card);
          color: var(--text-primary);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-pill);
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          transition: var(--transition);
        }
        .home-secondary-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--text-muted);
        }
        .home-hero-stats {
          display: flex;
          justify-content: center;
          gap: 2.5rem;
          flex-wrap: wrap;
          padding: 2rem;
          background: rgba(24, 24, 27, 0.5);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(10px);
        }
        .home-hero-stat {
          text-align: center;
        }
        .home-hero-stat-value {
          display: block;
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-h1);
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .home-hero-stat-label {
          font-size: 0.8125rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Sections */
        .home-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 5rem 1.5rem;
        }
        .home-section-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        .home-section-header h2 {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-h1);
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }
        .home-section-header p {
          color: var(--text-secondary);
          font-size: 1.05rem;
        }

        /* Stats Grid */
        .home-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .home-stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: var(--transition);
        }
        .home-stat-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .home-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: #fff;
        }
        .home-stat-info {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
        }
        .home-stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-h1);
          line-height: 1;
        }
        .home-stat-name {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 500;
          padding-bottom: 0.25rem;
        }
        .home-stat-detail {
          font-size: 0.8125rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-light);
          padding-top: 0.75rem;
        }

        /* Features Grid */
        .home-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.25rem;
        }
        .home-feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 2rem;
          transition: var(--transition);
          text-decoration: none;
          display: flex;
          flex-direction: column;
        }
        .home-feature-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        .home-feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .home-feature-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-h1);
          margin-bottom: 0.5rem;
        }
        .home-feature-desc {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
          flex: 1;
        }
        .home-feature-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary);
          transition: var(--transition);
        }
        .home-feature-card:hover .home-feature-link {
          gap: 0.75rem;
        }

        /* Activity Grid */
        .home-activity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 1.5rem;
        }
        .home-panel {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: var(--transition);
        }
        .home-panel:hover {
          border-color: var(--border-strong);
        }
        .home-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-light);
        }
        .home-panel-header h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-h1);
        }
        .home-view-all {
          font-size: 0.8125rem;
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
        }
        .home-view-all:hover {
          text-decoration: underline;
        }
        .home-panel-body {
          padding: 0.5rem 0;
        }

        /* Activity Items */
        .home-activity-item {
          display: flex;
          gap: 1rem;
          padding: 0.875rem 1.5rem;
          transition: var(--transition);
        }
        .home-activity-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .home-activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          margin-top: 6px;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(14, 165, 233, 0.4);
        }
        .home-activity-content {
          flex: 1;
          min-width: 0;
        }
        .home-activity-action {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .home-activity-detail {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 0.125rem;
        }
        .home-activity-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        /* Notification items */
        .home-notif-item {
          display: flex;
          gap: 0.875rem;
          padding: 0.875rem 1.5rem;
          transition: var(--transition);
        }
        .home-notif-item.unread {
          background: rgba(14, 165, 233, 0.03);
        }
        .home-notif-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .home-notif-icon {
          font-size: 1.125rem;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
        }
        .home-notif-content {
          flex: 1;
          min-width: 0;
        }
        .home-notif-title {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .home-notif-msg {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 0.125rem;
        }
        .home-notif-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        /* Task items */
        .home-task-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1.5rem;
          transition: var(--transition);
        }
        .home-task-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .home-task-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .home-task-dot.published { background: var(--success); box-shadow: 0 0 6px rgba(16,185,129,0.4); }
        .home-task-dot.draft { background: var(--warning); box-shadow: 0 0 6px rgba(245,158,11,0.4); }
        .home-task-dot.scheduled { background: var(--info); box-shadow: 0 0 6px rgba(14,165,233,0.4); }
        .home-task-content {
          flex: 1;
          min-width: 0;
        }
        .home-task-title {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .home-task-date {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.125rem;
        }
        .home-task-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-pill);
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        /* Empty state */
        .home-empty {
          text-align: center;
          padding: 3rem;
          color: var(--text-muted);
          font-weight: 500;
          grid-column: 1 / -1;
        }
        .home-empty-small {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        /* CTA Section */
        .home-cta-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem 5rem;
        }
        .home-cta-card {
          background: var(--gradient-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 4rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .home-cta-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gradient-primary);
        }
        .home-cta-card h2 {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-h1);
          margin-bottom: 1rem;
        }
        .home-cta-card p {
          font-size: 1.05rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        .home-cta-actions {
          display: flex;
          justify-content: center;
        }

        /* Footer */
        .home-footer {
          border-top: 1px solid var(--border-light);
          background: var(--bg-sidebar);
        }
        .home-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .home-footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .home-footer-links {
          display: flex;
          gap: 1.5rem;
        }
        .home-footer-links a {
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: var(--transition);
        }
        .home-footer-links a:hover {
          color: var(--text-primary);
        }
        .home-footer-copy {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .home-hero-title {
            font-size: 2.25rem;
          }
          .home-hero-subtitle {
            font-size: 1rem;
          }
          .home-section-header h2 {
            font-size: 1.75rem;
          }
          .home-hero-stats {
            gap: 1.5rem;
          }
          .home-nav-links a:not(.home-cta-btn) {
            display: none;
          }
          .home-stats-grid {
            grid-template-columns: 1fr;
          }
          .home-features-grid {
            grid-template-columns: 1fr;
          }
          .home-activity-grid {
            grid-template-columns: 1fr;
          }
          .home-footer-inner {
            flex-direction: column;
            text-align: center;
          }
        }
        @media (max-width: 480px) {
          .home-hero-title {
            font-size: 1.75rem;
          }
          .home-hero-actions {
            flex-direction: column;
          }
          .home-primary-btn, .home-secondary-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}