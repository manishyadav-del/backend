'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Admin menu groups (full access)
const adminMenuGroups = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    ],
  },
  {
    id: 'content',
    label: 'Content Management',
    icon: '🌐',
    items: [
      { label: 'Pages', href: '/dashboard/pages', icon: '📄' },
      { label: 'Services', href: '/dashboard/services', icon: '🛠️' },
      { label: 'Blog', href: '/dashboard/blog', icon: '📝' },
      { label: 'Media', href: '/dashboard/media', icon: '🖼️' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Leads',
    icon: '🎯',
    items: [
      { label: 'CTA / Leads', href: '/dashboard/cta', icon: '🎯' },
      { label: 'Forms', href: '/dashboard/forms', icon: '📋' },
      { label: 'Contacts', href: '/dashboard/contacts', icon: '📞' },
      { label: 'Email Settings', href: '/dashboard/email', icon: '📧' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📈',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
      { label: 'Live Visitors', href: '/dashboard/live', icon: '👁️' },
      { label: 'Leads', href: '/dashboard/leads', icon: '💼' },
    ],
  },
  {
    id: 'builder',
    label: 'Website Builder',
    icon: '🏗️',
    items: [
      { label: 'Header Builder', href: '/dashboard/header-builder', icon: '🔝' },
      { label: 'Footer Builder', href: '/dashboard/footer-builder', icon: '🔚' },
      { label: 'Navigation', href: '/dashboard/navigation', icon: '🧭' },
      { label: 'Redirects', href: '/dashboard/redirects', icon: '🔀' },
    ],
  },
  {
    id: 'reputation',
    label: 'Reputation & Content',
    icon: '⭐',
    items: [
      { label: 'Testimonials', href: '/dashboard/testimonials', icon: '⭐' },
      { label: 'FAQ', href: '/dashboard/faqs', icon: '❓' },
      { label: 'Team', href: '/dashboard/team', icon: '👥' },
    ],
  },
  {
    id: 'seo',
    label: 'SEO & Performance',
    icon: '🔍',
    items: [
      { label: 'SEO', href: '/dashboard/seo', icon: '🔍' },
      { label: 'Performance', href: '/dashboard/performance', icon: '⚡' },
    ],
  },
  {
    id: 'security',
    label: 'Security & Compliance',
    icon: '🛡️',
    items: [
      { label: 'Security', href: '/dashboard/security', icon: '🔒' },
      { label: 'Login History', href: '/dashboard/login-history', icon: '🕐' },
      { label: 'Compliance', href: '/dashboard/compliance', icon: '✅' },
      { label: 'Backup', href: '/dashboard/backup', icon: '💾' },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    icon: '👥',
    items: [
      { label: 'Users', href: '/dashboard/users', icon: '👤' },
      { label: 'Notifications', href: '/dashboard/notifications', icon: '🔔' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: '⚙️',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
      { label: 'Dev Tools', href: '/dashboard/dev-tools', icon: '🛠️' },
    ],
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: '⚖️',
    items: [
      { label: 'Legal', href: '/dashboard/legal', icon: '⚖️' },
    ],
  },
];

// User menu groups (limited access - essential content only)
const userMenuGroups = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    items: [
      { label: 'My Dashboard', href: '/user-dashboard', icon: '📊' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: '🌐',
    items: [
      { label: 'Pages', href: '/dashboard/pages', icon: '📄' },
      { label: 'Services', href: '/dashboard/services', icon: '🛠️' },
      { label: 'Blog', href: '/dashboard/blog', icon: '📝' },
    ],
  },
  {
    id: 'notifications',
    label: 'Updates',
    icon: '🔔',
    items: [
      { label: 'Notifications', href: '/dashboard/notifications', icon: '🔔' },
      { label: 'Activity', href: '/dashboard/activity', icon: '📋' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileToggle }) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState({});
  const [userRole, setUserRole] = useState('admin');

  useEffect(() => {
    // Fetch user role to determine which menu to show
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUserRole(data.user.role);
      })
      .catch(() => {});
  }, []);

  // Select menu groups based on role
  const menuGroups = (() => {
    if (userRole === 'admin') {
      return adminMenuGroups;
    }
    
    if (userRole === 'manager') {
      // Show all except users and security, and remove dev tools from system group
      return adminMenuGroups
        .filter(g => g.id !== 'users' && g.id !== 'security')
        .map(g => {
          if (g.id === 'system') {
            return {
              ...g,
              items: g.items.filter(item => item.label !== 'Dev Tools')
            };
          }
          return g;
        });
    }
    
    if (userRole === 'editor' || userRole === 'viewer') {
      // Editor & Viewer Menu (Access to pages, blogs, media, FAQs, testimonials, settings)
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: '📊',
          items: [
            { label: 'My Dashboard', href: '/user-dashboard', icon: '📊' },
          ],
        },
        {
          id: 'content',
          label: 'Content',
          icon: '🌐',
          items: [
            { label: 'Pages', href: '/dashboard/pages', icon: '📄' },
            { label: 'Blog', href: '/dashboard/blog', icon: '📝' },
            { label: 'Media', href: '/dashboard/media', icon: '🖼️' },
          ],
        },
        {
          id: 'reputation',
          label: 'Reputation',
          icon: '⭐',
          items: [
            { label: 'Testimonials', href: '/dashboard/testimonials', icon: '⭐' },
            { label: 'FAQ', href: '/dashboard/faqs', icon: '❓' },
            { label: 'Team', href: '/dashboard/team', icon: '👥' },
          ],
        },
        {
          id: 'seo',
          label: 'SEO',
          icon: '🔍',
          items: [
            { label: 'SEO', href: '/dashboard/seo', icon: '🔍' },
          ],
        },
        {
          id: 'updates',
          label: 'Updates',
          icon: '🔔',
          items: [
            { label: 'Notifications', href: '/dashboard/notifications', icon: '🔔' },
          ],
        },
        {
          id: 'system',
          label: 'System',
          icon: '⚙️',
          items: [
            { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' }
          ]
        }
      ];
    }
    
    return userMenuGroups;
  })();

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
        {menuGroups.map((group) => {
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
        })}
      </nav>
    </aside>
  );
}