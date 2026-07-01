'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Developer-focused inline SVG Icons for groups and items
const Icons = {
  dashboard: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  marketing: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  forms: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  contacts: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  email: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  leads: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  security: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  )
};

const IconColorMap = {
  dashboard: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', shadow: 'rgba(139, 92, 246, 0.3)' },
  marketing: { bg: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', shadow: 'rgba(236, 72, 153, 0.3)' },
  forms: { bg: 'linear-gradient(135deg, #06b6d4 0%, #0369a1 100%)', shadow: 'rgba(6, 182, 212, 0.3)' },
  contacts: { bg: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', shadow: 'rgba(20, 184, 166, 0.3)' },
  email: { bg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', shadow: 'rgba(99, 102, 241, 0.3)' },
  leads: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)', shadow: 'rgba(139, 92, 246, 0.3)' },
  analytics: { bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', shadow: 'rgba(244, 63, 94, 0.3)' },
  security: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', shadow: 'rgba(16, 185, 129, 0.3)' }
};

const ROLE_PRIORITY = ['viewer', 'manager', 'admin', 'super_admin'];

function getEffectiveRole(userRole, userRoles = []) {
  const allRoles = [userRole, ...userRoles].filter(Boolean).map(r => r.toLowerCase());
  let best = 'viewer';
  for (const r of allRoles) {
    if (ROLE_PRIORITY.indexOf(r) > ROLE_PRIORITY.indexOf(best)) {
      best = r;
    }
  }
  return best;
}

function isAllowedForRole(item, effectiveRole) {
  if (effectiveRole === 'super_admin' || effectiveRole === 'admin') return true;
  if (!item.roles || item.roles.length === 0) return true;
  return item.roles.includes(effectiveRole);
}

const ROLE_BADGE = {
  super_admin:    { label: 'Super Admin', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  admin:          { label: 'Admin',       color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  manager:        { label: 'Manager',     color: '#0d9488', bg: 'rgba(13,148,136,0.12)' },
  viewer:         { label: 'Viewer',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

// CRM Dashboard layouts & components mapping
const allMenuGroups = [
  {
    id: 'crm_overview',
    label: 'CRM Overview',
    iconKey: 'dashboard',
    items: [
      { label: 'CRM Dashboard', href: '/admin', iconKey: 'dashboard', permission: null, roles: [] }
    ]
  },
  {
    id: 'subscribers',
    label: 'Subscriber Management',
    iconKey: 'leads',
    items: [
      { label: 'Subscriber Directory', href: '/admin/subscribers', iconKey: 'contacts', permission: 'leads.view', roles: ['admin', 'super_admin', 'manager'] }
    ]
  },
  {
    id: 'marketing_campaigns',
    label: 'Campaigns & Social',
    iconKey: 'marketing',
    items: [
      { label: 'Campaign Dispatch', href: '/admin/campaigns', iconKey: 'email', permission: 'leads.view', roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Newsletter Templates', href: '/admin/templates', iconKey: 'dashboard', permission: 'leads.view', roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Push Notifications', href: '/admin/push', iconKey: 'marketing', permission: 'leads.view', roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Social Scheduler', href: '/admin/social', iconKey: 'leads', permission: 'leads.view', roles: ['admin', 'super_admin', 'manager'] }
    ]
  },
  {
    id: 'integrations',
    label: 'Email System Integration',
    iconKey: 'email',
    items: [
      { label: 'Email Configuration', href: '/admin/email', iconKey: 'email', permission: 'settings.view', roles: ['admin', 'super_admin'] }
    ]
  },
  {
    id: 'tracking_analytics',
    label: 'Tracking & Ads',
    iconKey: 'analytics',
    items: [
      { label: 'Visitor Analytics', href: '/admin/analytics', iconKey: 'analytics', permission: 'analytics.view', roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Cookie Consent Logs', href: '/admin/consent-logs', iconKey: 'security', permission: 'analytics.view', roles: ['admin', 'super_admin'] },
      { label: 'Ad Spaces', href: '/admin/ads', iconKey: 'forms', permission: 'leads.view', roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Advanced Reports', href: '/admin/reports', iconKey: 'analytics', permission: 'leads.view', roles: ['admin', 'super_admin', 'manager'] }
    ]
  }
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileToggle }) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState({});
  const [userPermissions, setUserPermissions] = useState(null);
  const [userRole, setUserRole] = useState('viewer');
  const [userName, setUserName] = useState('');
  const [effectiveRole, setEffectiveRole] = useState('viewer');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        const perms = data.user?.permissions || [];
        const role = data.user?.role || 'viewer';
        const roles = data.user?.roles || [];
        setUserPermissions(perms);
        setUserRole(role);
        setUserName(data.user?.name || data.user?.email || 'User');
        setEffectiveRole(getEffectiveRole(role, roles));
      })
      .catch(() => {
        setUserPermissions([]);
        setEffectiveRole('viewer');
      });
  }, []);

  const menuGroups = (userPermissions === null ? [] : allMenuGroups)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const roleAllowed = isAllowedForRole(item, effectiveRole);
        const permAllowed = !item.permission
          || effectiveRole === 'super_admin'
          || effectiveRole === 'admin'
          || userPermissions.includes(item.permission);
        return roleAllowed && permAllowed;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const isGroupActive = (group) => {
    return group.items.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/')
    );
  };

  const isItemActive = (href) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sidebarClasses = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClasses}>
      <div className="sidebar-header">
        <div className="sidebar-logo" style={{ color: '#8b5cf6' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        {!collapsed && <span className="sidebar-title" style={{ color: '#a78bfa' }}>Marketing CRM</span>}
      </div>

      <nav className="sidebar-nav">
        {userPermissions === null ? (
          <div className="sidebar-loading" style={{ padding: '1rem', opacity: 0.4, fontSize: '0.8rem', textAlign: 'center' }}>
            Loading...
          </div>
        ) : (
          menuGroups.map((group) => {
            const isExpanded = expandedGroups[group.id] || isGroupActive(group);

            return (
              <div key={group.id} className="sidebar-group">
                <button
                  className={`sidebar-group-header ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                  title={collapsed ? group.label : undefined}
                >
                  <span
                    className="sidebar-group-icon"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      background: IconColorMap[group.iconKey]?.bg || 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      boxShadow: `0 2px 8px ${IconColorMap[group.iconKey]?.shadow || 'rgba(0,0,0,0.1)'}`,
                      marginRight: collapsed ? '0' : '0.75rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {Icons[group.iconKey]}
                  </span>
                  {!collapsed && <span className="sidebar-group-label">{group.label}</span>}
                  {!collapsed && (
                    <span className={`sidebar-group-arrow ${isExpanded ? 'expanded' : ''}`}>
                      {Icons.chevronRight}
                    </span>
                  )}
                </button>
 
                <div className={`sidebar-group-items-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div className="sidebar-group-items">
                    {group.items.map((item) => {
                      const active = isItemActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`sidebar-link ${active ? 'active' : ''}`}
                          title={collapsed ? item.label : undefined}
                          style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem' }}
                          onClick={() => {
                            if (mobileOpen && onMobileToggle) {
                              onMobileToggle();
                            }
                          }}
                        >
                          <span 
                            className="sidebar-icon"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '22px',
                              height: '22px',
                              borderRadius: '6px',
                              background: IconColorMap[item.iconKey]?.bg || 'rgba(255,255,255,0.05)',
                              color: '#fff',
                              boxShadow: `0 2px 6px ${IconColorMap[item.iconKey]?.shadow || 'rgba(0,0,0,0.1)'}`,
                              marginRight: collapsed ? '0' : '0.75rem',
                              transition: 'all 0.2s',
                              transform: active ? 'scale(1.1)' : 'none'
                            }}
                          >
                            {Icons[item.iconKey]}
                          </span>
                          {!collapsed && <span className="sidebar-label" style={{ fontWeight: active ? '700' : '500' }}>{item.label}</span>}
                          {active && <span className="active-indicator" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* User Role Badge */}
      <div style={{
        padding: collapsed ? '0.75rem 0' : '0.85rem 1rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
        marginTop: 'auto',
      }}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: ROLE_BADGE[effectiveRole]?.bg || 'rgba(255,255,255,0.08)',
          border: `1.5px solid ${ROLE_BADGE[effectiveRole]?.color || '#6b7280'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.75rem',
          color: ROLE_BADGE[effectiveRole]?.color || '#6b7280',
          flexShrink: 0,
          textTransform: 'uppercase',
        }}>
          {userName ? userName.charAt(0) : '?'}
        </div>

        {!collapsed && (
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {userName}
            </div>
            <span style={{
              display: 'inline-block',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              background: ROLE_BADGE[effectiveRole]?.bg || 'rgba(107,114,128,0.12)',
              color: ROLE_BADGE[effectiveRole]?.color || '#6b7280',
              marginTop: '0.1rem',
            }}>
              {ROLE_BADGE[effectiveRole]?.label || effectiveRole}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}