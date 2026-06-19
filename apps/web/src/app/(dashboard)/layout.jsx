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
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    // Fetch current user
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          // If non-admin user is on admin dashboard routes (except user-dashboard), redirect
          if (data.user.role !== 'admin' && pathname.startsWith('/dashboard') && !pathname.startsWith('/user-dashboard')) {
            router.replace('/user-dashboard');
          }
          // If admin is on user-dashboard route, redirect to admin dashboard
          if (data.user.role === 'admin' && pathname.startsWith('/user-dashboard')) {
            router.replace('/dashboard');
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
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

            <div className="topbar-center" />

            <div className="topbar-right">
              <Link href="/dashboard/notifications" className="topbar-btn" title="Notifications" aria-label="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span className="dot" />}
              </Link>
              <Link href="/dashboard/activity" className="topbar-btn" title="Activity" aria-label="Activity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </Link>
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
                        href={user?.role === 'admin' ? '/dashboard/settings' : '/user-dashboard/settings'}
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
                        href={user?.role === 'admin' ? '/dashboard/settings' : '/user-dashboard/settings'}
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