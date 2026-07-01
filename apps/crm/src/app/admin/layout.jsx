'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { UserContext } from '@/lib/userContext.js';

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [theme, setTheme] = useState('dark');
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [hoverNotificationsOpen, setHoverNotificationsOpen] = useState(false);
  const [hoverActivityOpen, setHoverActivityOpen] = useState(false);

  const handleNotificationsHover = () => {
    setHoverNotificationsOpen(true);
    fetch('/api/notifications?projectId=demo')
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications.slice(0, 5));
        }
      })
      .catch((err) => console.error(err));
  };

  const handleActivityHover = () => {
    setHoverActivityOpen(true);
    fetch('/api/activity-logs?limit=5')
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) {
          setActivityLogs(data.logs.slice(0, 5));
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleApplyChanges = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/sync/apply-changes', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert(json.message || 'Successfully applied changes across all connected websites.');
      } else {
        alert(json.error || 'Failed to apply changes.');
      }
    } catch (err) {
      alert('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.replace('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    const publicAuthPaths = [
      '/admin/login',
      '/admin/register',
      '/admin/forgot-password',
      '/admin/reset-password'
    ];

    if (publicAuthPaths.some(p => pathname.startsWith(p))) {
      setLoading(false);
      return;
    }

    // Fetch current user
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          // If Client User is on admin dashboard routes (except user-dashboard), redirect
          if (data.user.role === 'Client User' && pathname.startsWith('/admin') && !pathname.includes('/user-dashboard')) {
            router.replace('/admin/user-dashboard');
          }
          // If non-client user is on user-dashboard route, redirect to admin overview
          if (data.user.role !== 'Client User' && pathname.includes('/user-dashboard')) {
            router.replace('/admin');
          }
          setLoading(false);
        } else {
          router.replace('/admin/login');
        }
      })
      .catch(() => {
        router.replace('/admin/login');
      });

    // Fetch unread notification count
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.stats) {
          setUnreadCount(data.data.stats.unreadNotifications);
        }
      })
      .catch(() => {});
  }, [pathname, router]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyHeight: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <div className="loading">Loading session...</div>
      </div>
    );
  }

  const publicAuthPaths = [
    '/admin/login',
    '/admin/register',
    '/admin/forgot-password',
    '/admin/reset-password'
  ];

  if (publicAuthPaths.some(p => pathname.startsWith(p))) {
    return (
      <UserContext.Provider value={{ user, loading, logout: handleLogout }}>
        {children}
      </UserContext.Provider>
    );
  }

  // Generate breadcrumb from pathname
  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, arr) => {
      const path = '/' + arr.slice(0, index + 1).join('/');
      const label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { label, path, isLast: index === arr.length - 1 };
    });

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A';
  const userName = user?.name || user?.email?.split('@')[0] || 'Admin';
  const userRole = user?.role || 'Admin';

  const isEditorPage = /^\/admin\/pages\/[^\/]+$/.test(pathname);

  if (isEditorPage) {
    return (
      <UserContext.Provider value={{ user, loading, logout: handleLogout }}>
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0f172a' }}>
          {children}
        </div>
      </UserContext.Provider>
    );
  }

  return (
    <UserContext.Provider value={{ user, loading, logout: handleLogout }}>
      <div className="dashboard-layout">
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={toggleMobileMenu}
          />
        )}

        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={toggleSidebar}
          mobileOpen={mobileMenuOpen}
          onMobileToggle={toggleMobileMenu}
        />

        <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
          <header className="topbar">
            <div className="topbar-left">
              <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
              </button>
              <div className="breadcrumb">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {i > 0 && <span className="breadcrumb-sep">›</span>}
                    {crumb.isLast ? (
                      <span className="current">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.path}>{crumb.label}</Link>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="topbar-right">
              <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'var(--transition)',
                  outline: 'none'
                }}
              >
                {theme === 'dark' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>
                )}
              </button>

              <div 
                className="relative-container" 
                style={{ position: 'relative', display: 'inline-block' }}
                onMouseEnter={handleNotificationsHover}
                onMouseLeave={() => setHoverNotificationsOpen(false)}
              >
                <Link href="/admin/notifications" className="topbar-btn" title="Notifications" aria-label="Notifications">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {unreadCount > 0 && <span className="dot" />}
                </Link>
                {hoverNotificationsOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      minWidth: '290px',
                      maxWidth: '320px',
                      padding: '0.75rem',
                      zIndex: 1000,
                      animation: 'slideDown 0.15s ease-out'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.875rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-h1)' }}>
                      <span>🔔 Recent Notifications</span>
                      {unreadCount > 0 && <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>{unreadCount} unread</span>}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem 0', textAlign: 'center' }}>No recent notifications</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                        {notifications.map(notif => (
                          <div key={notif.id} style={{ padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', background: notif.isRead ? 'transparent' : 'rgba(13, 148, 136, 0.08)', borderLeft: notif.isRead ? 'none' : '3px solid var(--accent)' }}>
                            <div style={{ fontWeight: notif.isRead ? 'normal' : 'bold', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{notif.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{notif.message}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link href="/admin/notifications" style={{ display: 'block', textAlign: 'center', fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>

              <div 
                className="relative-container" 
                style={{ position: 'relative', display: 'inline-block' }}
                onMouseEnter={handleActivityHover}
                onMouseLeave={() => setHoverActivityOpen(false)}
              >
                <Link href="/admin/activity" className="topbar-btn" title="Activity" aria-label="Activity">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </Link>
                {hoverActivityOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      minWidth: '290px',
                      maxWidth: '320px',
                      padding: '0.75rem',
                      zIndex: 1000,
                      animation: 'slideDown 0.15s ease-out'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.875rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-h1)' }}>
                      ⚡ Recent Activity
                    </div>
                    {activityLogs.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem 0', textAlign: 'center' }}>No recent activity</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                        {activityLogs.map(log => (
                          <div key={log.id} style={{ padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                              <span style={{ fontWeight: 'bold' }}>{log.user?.name || log.user?.email || 'User'}</span> {log.action}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{log.details || ''}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link href="/admin/activity" style={{ display: 'block', textAlign: 'center', fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                      View all activity
                    </Link>
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)} 
                  className="user-menu"
                  style={{ border: '1px solid var(--border-light)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none' }}
                >
                  <div className="user-avatar">{userInitial}</div>
                  <div className="user-info-text" style={{ textAlign: 'left' }}>
                    <div className="user-name">{userName}</div>
                    <div className="user-role">{userRole}</div>
                  </div>
                </button>

                {dropdownOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div 
                      style={{ 
                        position: 'absolute', 
                        right: 0, 
                        top: 'calc(100% + 0.5rem)', 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border-strong)', 
                        borderRadius: 'var(--radius-md)', 
                        boxShadow: 'var(--shadow-lg)', 
                        padding: '0.5rem', 
                        minWidth: '160px', 
                        zIndex: 999,
                        animation: 'slideDown 0.15s ease-out'
                      }}
                    >
                      <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.25rem' }}>
                        <div className="user-name" style={{ fontSize: '0.875rem' }}>{userName}</div>
                        <div className="user-role" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{userRole}</div>
                      </div>
                      <Link 
                        href={user?.role === 'admin' ? '/admin/settings' : '/admin/user-dashboard/settings'}
                        onClick={() => setDropdownOpen(false)}
                        style={{ 
                          display: 'block', 
                          padding: '0.5rem 0.75rem', 
                          color: 'var(--text-primary)', 
                          fontSize: '0.875rem', 
                          borderRadius: 'var(--radius-sm)',
                          transition: 'var(--transition)'
                        }}
                        className="dropdown-item"
                      >
                        Profile
                      </Link>
                      <Link 
                        href={user?.role === 'admin' ? '/admin/settings' : '/admin/user-dashboard/settings'}
                        onClick={() => setDropdownOpen(false)}
                        style={{ 
                          display: 'block', 
                          padding: '0.5rem 0.75rem', 
                          color: 'var(--text-primary)', 
                          fontSize: '0.875rem', 
                          borderRadius: 'var(--radius-sm)',
                          transition: 'var(--transition)'
                        }}
                        className="dropdown-item"
                      >
                        Settings
                      </Link>
                      <button 
                        onClick={handleLogout}
                        style={{ 
                          display: 'block', 
                          width: '100%', 
                          textAlign: 'left',
                          padding: '0.5rem 0.75rem', 
                          color: 'var(--danger)', 
                          background: 'transparent',
                          border: 'none',
                          fontSize: '0.875rem', 
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                        className="dropdown-item"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="content-area">
            {children}
          </main>
        </div>
      </div>
    </UserContext.Provider>
  );
}