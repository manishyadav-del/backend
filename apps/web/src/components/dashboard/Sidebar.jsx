'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Full menu definition — each item declares the permission required to see it
const allMenuGroups = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '📊', permission: null },
      { label: 'Websites', href: '/dashboard/websites', icon: '🔌', permission: null },
      { label: 'Routes', href: '/dashboard/routes', icon: '🛣️', permission: null },
      { label: 'Content Blocks', href: '/dashboard/content-manager', icon: '📝', permission: null },
      { label: 'Features Toggle', href: '/dashboard/features', icon: '🧩', permission: null },
      { label: 'Components', href: '/dashboard/components', icon: '🧩', permission: null },
    ],
  },
  {
    id: 'content',
    label: 'Content Management',
    icon: '🌐',
    items: [
      { label: 'Pages', href: '/dashboard/pages', icon: '📄', permission: 'pages.view' },
      { label: 'Services', href: '/dashboard/services', icon: '🛠️', permission: 'services.view' },
      { label: 'Blog', href: '/dashboard/blog', icon: '📝', permission: 'blog.view' },
      { label: 'Media', href: '/dashboard/media', icon: '🖼️', permission: 'media.view' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Leads',
    icon: '🎯',
    items: [
      { label: 'CTA / Leads', href: '/dashboard/cta', icon: '🎯', permission: 'leads.view' },
      { label: 'Forms', href: '/dashboard/forms', icon: '📋', permission: 'forms.view' },
      { label: 'Contacts', href: '/dashboard/contacts', icon: '📞', permission: 'contacts.view' },
      { label: 'Email Settings', href: '/dashboard/email', icon: '📧', permission: 'settings.view' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📈',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics', icon: '📈', permission: 'analytics.view' },
      { label: 'Live Visitors', href: '/dashboard/live', icon: '👁️', permission: 'analytics.view' },
      { label: 'Leads', href: '/dashboard/leads', icon: '💼', permission: 'leads.view' },
    ],
  },
  {
    id: 'builder',
    label: 'Website Builder',
    icon: '🏗️',
    items: [
      { label: 'Header Builder', href: '/dashboard/header-builder', icon: '🔝', permission: 'settings.view' },
      { label: 'Footer Builder', href: '/dashboard/footer-builder', icon: '🔚', permission: 'settings.view' },
      { label: 'Navigation', href: '/dashboard/navigation', icon: '🧭', permission: 'settings.view' },
      { label: 'Redirects', href: '/dashboard/redirects', icon: '🔀', permission: 'redirects.view' },
    ],
  },
  {
    id: 'reputation',
    label: 'Reputation & Content',
    icon: '⭐',
    items: [
      { label: 'Testimonials', href: '/dashboard/testimonials', icon: '⭐', permission: 'testimonials.view' },
      { label: 'FAQ', href: '/dashboard/faqs', icon: '❓', permission: 'faq.view' },
      { label: 'Team', href: '/dashboard/team', icon: '👥', permission: 'pages.view' },
    ],
  },
  {
    id: 'seo',
    label: 'SEO & Performance',
    icon: '🔍',
    items: [
      { label: 'SEO', href: '/dashboard/seo', icon: '🔍', permission: 'seo.view' },
      { label: 'Performance', href: '/dashboard/performance', icon: '⚡', permission: 'security.view' },
    ],
  },
  {
    id: 'security',
    label: 'Security & Compliance',
    icon: '🛡️',
    items: [
      { label: 'Security', href: '/dashboard/security', icon: '🔒', permission: 'security.view' },
      { label: 'Login History', href: '/dashboard/login-history', icon: '🕐', permission: 'security.view' },
      { label: 'Compliance', href: '/dashboard/compliance', icon: '✅', permission: 'security.view' },
      { label: 'Backup', href: '/dashboard/backup', icon: '💾', permission: 'security.view' },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    icon: '👥',
    items: [
      { label: 'Users', href: '/dashboard/users', icon: '👤', permission: 'users.view' },
      { label: 'Notifications', href: '/dashboard/notifications', icon: '🔔', permission: 'notifications.view' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: '⚙️',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: '⚙️', permission: 'settings.view' },
      { label: 'Dev Tools', href: '/dashboard/dev-tools', icon: '🛠️', permission: 'security.view' },
    ],
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: '⚖️',
    items: [
      { label: 'Legal', href: '/dashboard/legal', icon: '⚖️', permission: 'pages.view' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileToggle }) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState({});
  const [userPermissions, setUserPermissions] = useState(null); // null = loading

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.permissions) {
          setUserPermissions(data.user.permissions);
        } else {
          setUserPermissions([]);
        }
      })
      .catch(() => setUserPermissions([]));
  }, []);

  // Filter menu groups based on user permissions
  const menuGroups = (userPermissions === null ? [] : allMenuGroups)
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || userPermissions.includes(item.permission)
      ),
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
        <div className="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </div>
        {!collapsed && <span className="sidebar-title">Global Backend</span>}
      </div>

      <button className="sidebar-toggle mobile-close" onClick={onMobileToggle} aria-label="Close menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <button className="sidebar-toggle desktop-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        {collapsed ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        )}
      </button>

      <nav className="sidebar-nav">
        {userPermissions === null ? (
          <div className="sidebar-loading" style={{ padding: '1rem', opacity: 0.4, fontSize: '0.8rem', textAlign: 'center' }}>
            Loading...
          </div>
        ) : (
          menuGroups.map((group) => {
            const isActive = isGroupActive(group);
            const isExpanded = expandedGroups[group.id] || isActive;

            return (
              <div key={group.id} className="sidebar-group">
                {!collapsed && (
                  <button
                    className="sidebar-group-header"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                  >
                    <span className="sidebar-group-icon">{group.icon}</span>
                    <span className="sidebar-group-label">{group.label}</span>
                    <span className={`sidebar-group-arrow ${isExpanded ? 'expanded' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </span>
                  </button>
                )}

                {isExpanded && (
                  <div className="sidebar-group-items">
                    {group.items.map((item) => {
                      const active = isItemActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`sidebar-link ${active ? 'active' : ''}`}
                          title={collapsed ? item.label : undefined}
                        >
                          <span className="sidebar-icon">{item.icon}</span>
                          {!collapsed && <span className="sidebar-label">{item.label}</span>}
                          {active && <span className="active-indicator" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
}