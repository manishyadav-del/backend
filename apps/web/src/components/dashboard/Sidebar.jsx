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
  websites: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  routes: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 18V5a3 3 0 0 0-3-3H4" />
      <circle cx="4" cy="4" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M16 18H9a3 3 0 0 1-3-3V9" />
    </svg>
  ),
  content: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  features: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="6" width="20" height="12" rx="6" />
      <circle cx="8" cy="12" r="4" />
    </svg>
  ),
  components: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  pages: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  services: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  blog: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  media: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  live: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  builder: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  navigation: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  redirects: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 3h5v5" />
      <path d="M4 20L21 3" />
      <path d="M21 16v5h-5" />
      <path d="M4 4l17 17" />
    </svg>
  ),
  reputation: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  faq: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  team: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  seo: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  performance: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  security: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  ),
  system: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  legal: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  )
};

const IconColorMap = {
  dashboard: { bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', shadow: 'rgba(59, 130, 246, 0.3)' },
  websites: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', shadow: 'rgba(16, 185, 129, 0.3)' },
  routes: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', shadow: 'rgba(139, 92, 246, 0.3)' },
  content: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', shadow: 'rgba(245, 158, 11, 0.3)' },
  features: { bg: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', shadow: 'rgba(236, 72, 153, 0.3)' },
  components: { bg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', shadow: 'rgba(6, 182, 212, 0.3)' },
  pages: { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', shadow: 'rgba(59, 130, 246, 0.3)' },
  services: { bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', shadow: 'rgba(16, 185, 129, 0.3)' },
  blog: { bg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', shadow: 'rgba(245, 158, 11, 0.3)' },
  media: { bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', shadow: 'rgba(236, 72, 153, 0.3)' },
  analytics: { bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', shadow: 'rgba(244, 63, 94, 0.3)' },
  live: { bg: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)', shadow: 'rgba(16, 185, 129, 0.3)' },
  builder: { bg: 'linear-gradient(135deg, #f59e0b 0%, #78350f 100%)', shadow: 'rgba(245, 158, 11, 0.3)' },
  navigation: { bg: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', shadow: 'rgba(59, 130, 246, 0.3)' },
  redirects: { bg: 'linear-gradient(135deg, #ec4899 0%, #831843 100%)', shadow: 'rgba(236, 72, 153, 0.3)' },
  reputation: { bg: 'linear-gradient(135deg, #06b6d4 0%, #0c4a6e 100%)', shadow: 'rgba(6, 182, 212, 0.3)' },
  faq: { bg: 'linear-gradient(135deg, #14b8a6 0%, #115e59 100%)', shadow: 'rgba(20, 184, 166, 0.3)' },
  team: { bg: 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)', shadow: 'rgba(99, 102, 241, 0.3)' },
  seo: { bg: 'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)', shadow: 'rgba(244, 63, 94, 0.3)' },
  performance: { bg: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)', shadow: 'rgba(16, 185, 129, 0.3)' },
  security: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)', shadow: 'rgba(139, 92, 246, 0.3)' },
  users: { bg: 'linear-gradient(135deg, #f59e0b 0%, #92400e 100%)', shadow: 'rgba(245, 158, 11, 0.3)' },
  system: { bg: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', shadow: 'rgba(59, 130, 246, 0.3)' },
  legal: { bg: 'linear-gradient(135deg, #ec4899 0%, #9d174d 100%)', shadow: 'rgba(236, 72, 153, 0.3)' }
};

const ROLE_PRIORITY = ['viewer', 'content_writer', 'editor', 'manager', 'admin', 'super_admin'];

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
  editor:         { label: 'Editor',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  content_writer: { label: 'Writer',      color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  viewer:         { label: 'Viewer',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

// Exclusively CMS Menu Groups (No CRM/Marketing menu items)
const allMenuGroups = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    iconKey: 'dashboard',
    items: [
      { label: 'Overview',      href: '/admin/dashboard',          iconKey: 'dashboard',  permission: null,             roles: [] },
      { label: 'Websites',       href: '/admin/websites',       iconKey: 'websites',   permission: null,             roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Routes',         href: '/admin/routes',         iconKey: 'routes',     permission: null,             roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Content Blocks', href: '/admin/content-manager',iconKey: 'content',    permission: null,             roles: ['admin', 'super_admin', 'manager', 'editor', 'content_writer'] },
      { label: 'Features Toggle',href: '/admin/features',       iconKey: 'features',   permission: null,             roles: ['admin', 'super_admin'] },
      { label: 'Components',     href: '/admin/components',     iconKey: 'components', permission: null,             roles: ['admin', 'super_admin'] },
    ],
  },
  {
    id: 'content',
    label: 'Content Management',
    iconKey: 'content',
    items: [
      { label: 'Pages',    href: '/admin/pages',    iconKey: 'pages',    permission: 'pages.view',    roles: ['admin', 'super_admin', 'manager', 'editor', 'content_writer'] },
      { label: 'Services', href: '/admin/services', iconKey: 'services', permission: 'services.view', roles: ['admin', 'super_admin', 'manager', 'editor'] },
      { label: 'Blog',     href: '/admin/blogs',     iconKey: 'blog',     permission: 'blog.view',     roles: ['admin', 'super_admin', 'manager', 'editor', 'content_writer'] },
      { label: 'Categories', href: '/admin/categories', iconKey: 'routes', permission: 'blog.view',   roles: ['admin', 'super_admin', 'manager', 'editor', 'content_writer'] },
      { label: 'Tags',     href: '/admin/tags',     iconKey: 'seo',      permission: 'blog.view',   roles: ['admin', 'super_admin', 'manager', 'editor', 'content_writer'] },
      { label: 'Comments', href: '/admin/comments', iconKey: 'reputation', permission: 'blog.view',  roles: ['admin', 'super_admin', 'manager', 'editor'] },
      { label: 'Media',    href: '/admin/media',    iconKey: 'media',    permission: 'media.view',    roles: ['admin', 'super_admin', 'manager', 'editor', 'content_writer'] },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    iconKey: 'analytics',
    items: [
      { label: 'Analytics',     href: '/admin/analytics', iconKey: 'analytics', permission: 'analytics.view', roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Live Visitors', href: '/admin/live',      iconKey: 'live',      permission: 'analytics.view', roles: ['admin', 'super_admin', 'manager'] },
    ],
  },
  {
    id: 'builder',
    label: 'Website Builder',
    iconKey: 'builder',
    items: [
      { label: 'Header Builder', href: '/admin/header-builder', iconKey: 'builder',    permission: 'settings.view',   roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Footer Builder', href: '/admin/footer-builder', iconKey: 'builder',    permission: 'settings.view',   roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Navigation',     href: '/admin/navigation',     iconKey: 'navigation', permission: 'settings.view',   roles: ['admin', 'super_admin', 'manager'] },
      { label: 'Redirects',      href: '/admin/redirects',      iconKey: 'redirects',  permission: 'redirects.view',  roles: ['admin', 'super_admin'] },
    ],
  },
  {
    id: 'reputation',
    label: 'Reputation & Content',
    iconKey: 'reputation',
    items: [
      { label: 'Testimonials', href: '/admin/testimonials', iconKey: 'reputation', permission: 'testimonials.view', roles: ['admin', 'super_admin', 'manager', 'editor', 'content_writer'] },
      { label: 'FAQ',          href: '/admin/faqs',         iconKey: 'faq',        permission: 'faq.view',          roles: ['admin', 'super_admin', 'manager', 'editor', 'content_writer'] },
      { label: 'Team',         href: '/admin/team',         iconKey: 'team',       permission: 'pages.view',        roles: ['admin', 'super_admin', 'manager', 'editor'] },
    ],
  },
  {
    id: 'seo',
    label: 'SEO & Performance',
    iconKey: 'seo',
    items: [
      { label: 'SEO',         href: '/admin/seo',         iconKey: 'seo',         permission: 'seo.view',      roles: ['admin', 'super_admin', 'manager', 'editor'] },
      { label: 'Performance', href: '/admin/performance', iconKey: 'performance', permission: 'security.view', roles: ['admin', 'super_admin', 'manager'] },
    ],
  },
  {
    id: 'security',
    label: 'Security & Compliance',
    iconKey: 'security',
    items: [
      { label: 'Security',      href: '/admin/security',      iconKey: 'security',    permission: 'security.view', roles: ['admin', 'super_admin'] },
      { label: 'Login History', href: '/admin/login-history', iconKey: 'performance', permission: 'security.view', roles: ['admin', 'super_admin'] },
      { label: 'Compliance',    href: '/admin/compliance',    iconKey: 'security',    permission: 'security.view', roles: ['admin', 'super_admin'] },
      { label: 'Backup',        href: '/admin/backup',        iconKey: 'builder',     permission: 'security.view', roles: ['admin', 'super_admin'] },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    iconKey: 'users',
    items: [
      { label: 'Users',         href: '/admin/users',         iconKey: 'users',    permission: 'users.view',         roles: ['admin', 'super_admin'] },
      { label: 'Notifications', href: '/admin/notifications', iconKey: 'marketing', permission: 'notifications.view', roles: ['admin', 'super_admin', 'manager', 'editor', 'content_writer', 'viewer'] },
    ],
  },
  {
    id: 'system',
    label: 'System',
    iconKey: 'system',
    items: [
      { label: 'Settings',  href: '/admin/settings',  iconKey: 'system',   permission: 'settings.view', roles: ['admin', 'super_admin'] },
      { label: 'Dev Tools', href: '/admin/dev-tools', iconKey: 'services', permission: 'security.view', roles: ['admin', 'super_admin'] },
    ],
  },
  {
    id: 'legal',
    label: 'Legal',
    iconKey: 'legal',
    items: [
      { label: 'Legal', href: '/admin/legal', iconKey: 'legal', permission: 'pages.view', roles: ['admin', 'super_admin', 'manager'] },
    ],
  },
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
        <div className="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </div>
        {!collapsed && <span className="sidebar-title">Global Backend</span>}
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