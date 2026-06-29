import { NextResponse } from 'next/server';
import { rateLimit } from './lib/rateLimit.js';

// Blocked IPs Cache
let cachedBlockedIps = null;
let lastCacheFetch = 0;
const CACHE_TTL = 300000; // 5 minutes

async function isIpBlocked(request, ip) {
  // Bypass in development mode to avoid dev server deadlocks
  if (process.env.NODE_ENV === 'development') {
    return false;
  }

  // Bypass internal calls
  if (request.headers.get('x-internal-bypass') === 'true') {
    return false;
  }
  // Bypass local development and private network IPs for speed
  const isLocal = ip.includes('127.0.0.1') || 
                  ip === '::1' || 
                  ip.includes('localhost') || 
                  ip.includes('[::1]') ||
                  ip.includes('192.168.') || 
                  ip.includes('10.') || 
                  ip.includes('172.');
                  
  if (isLocal) {
    return false;
  }
  
  const { pathname } = request.nextUrl;
  // Bypass IP checking for assets and static files
  if (pathname.includes('.') || pathname.startsWith('/_next/')) {
    return false;
  }
  if (pathname.startsWith('/api/security/ip-block')) {
    return false;
  }

  const now = Date.now();
  if (!cachedBlockedIps || (now - lastCacheFetch > CACHE_TTL)) {
    try {
      const fetchUrl = new URL('/api/security/ip-block?projectId=default', request.url);
      const res = await fetch(fetchUrl, {
        headers: { 'x-internal-bypass': 'true' }
      });
      if (res.ok) {
        const data = await res.json();
        cachedBlockedIps = data.blockedIps || [];
        lastCacheFetch = now;
      }
    } catch (err) {
      console.error('Failed to fetch blocked IPs in middleware:', err);
    }
  }
  return cachedBlockedIps?.includes(ip) || false;
}

// Decode JWT without external library (Edge Runtime compatible)
function decodeToken(tokenValue) {
  try {
    const payload = tokenValue.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Map a dashboard page pathname to its required permission (module.view)
 */
function getRequiredPagePermission(pathname) {
  const map = [
    ['/dashboard/users', 'users.view'],
    ['/dashboard/security', 'security.view'],
    ['/dashboard/login-history', 'security.view'],
    ['/dashboard/backup', 'security.view'],
    ['/dashboard/performance', 'security.view'],
    ['/dashboard/dev-tools', 'security.view'],
    ['/dashboard/compliance', 'security.view'],
    ['/dashboard/settings', 'settings.view'],
    ['/dashboard/email', 'settings.view'],
    ['/dashboard/pages', 'pages.view'],
    ['/dashboard/blogs', 'blog.view'],
    ['/dashboard/media', 'media.view'],
    ['/dashboard/testimonials', 'testimonials.view'],
    ['/dashboard/faqs', 'faq.view'],
    ['/dashboard/team', 'pages.view'],
    ['/dashboard/services', 'services.view'],
    ['/dashboard/cta', 'leads.view'],
    ['/dashboard/forms', 'forms.view'],
    ['/dashboard/contacts', 'contacts.view'],
    ['/dashboard/leads', 'leads.view'],
    ['/dashboard/analytics', 'analytics.view'],
    ['/dashboard/live', 'analytics.view'],
    ['/dashboard/seo', 'seo.view'],
    ['/dashboard/header-builder', 'settings.view'],
    ['/dashboard/footer-builder', 'settings.view'],
    ['/dashboard/navigation', 'settings.view'],
    ['/dashboard/redirects', 'redirects.view'],
    ['/dashboard/notifications', 'notifications.view'],
    ['/dashboard/legal', 'pages.view'],
  ];

  for (const [prefix, perm] of map) {
    if (pathname.startsWith(prefix)) return perm;
  }
  return null; // No specific permission required
}

/**
 * Map an API pathname + method to required permission
 */
function getRequiredApiPermission(pathname, method) {
  const isWrite = method !== 'GET';
  let action = 'view';
  if (method === 'POST') {
    action = 'create';
  } else if (method === 'PUT' || method === 'PATCH') {
    action = 'edit';
  } else if (method === 'DELETE') {
    action = 'delete';
  }

  if (pathname.startsWith('/api/users')) return `users.${action}`;
  if (pathname.startsWith('/api/roles')) return `roles.${action}`;
  if (pathname.startsWith('/api/permissions')) return 'roles.view';
  if (pathname.startsWith('/api/security')) {
    return isWrite ? 'security.manage' : 'security.view';
  }
  if (pathname.startsWith('/api/dev-tools') || pathname.startsWith('/api/performance') || pathname.startsWith('/api/backup')) return 'security.view';
  if (pathname.startsWith('/api/email-settings') || pathname.startsWith('/api/global-settings')) {
    return isWrite ? 'settings.edit' : 'settings.view';
  }
  if (pathname.startsWith('/api/pages')) {
    if (pathname.includes('/publish') || pathname.includes('/drafts')) {
      return 'pages.publish';
    }
    return `pages.${action}`;
  }
  if (pathname.startsWith('/api/blogs')) {
    if (pathname.includes('/publish') || pathname.includes('/drafts')) {
      return 'blog.publish';
    }
    return `blog.${action}`;
  }
  if (pathname.startsWith('/api/media')) {
    if (method === 'POST') return 'media.upload';
    if (method === 'PUT' || method === 'PATCH') return 'media.replace';
    return `media.${action}`;
  }
  if (pathname.startsWith('/api/services')) return `services.${action}`;
  if (pathname.startsWith('/api/faqs')) return `faq.${action}`;
  if (pathname.startsWith('/api/testimonials')) return `testimonials.${action}`;
  if (pathname.startsWith('/api/contacts')) return `contacts.${action}`;
  if (pathname.startsWith('/api/leads')) {
    if (isWrite) return 'leads.edit_status';
    return 'leads.view';
  }
  if (pathname.startsWith('/api/forms')) return 'forms.view';
  if (pathname.startsWith('/api/analytics')) return 'analytics.view';
  if (pathname.startsWith('/api/redirects')) return `redirects.${action}`;
  if (pathname.startsWith('/api/navigation')) {
    return isWrite ? 'settings.edit' : 'settings.view';
  }
  if (pathname.startsWith('/api/seo')) return `seo.edit`;
  if (pathname.startsWith('/api/notifications')) return 'notifications.view';
  if (pathname.startsWith('/api/compliance')) return isWrite ? 'security.manage' : 'security.view';
  if (pathname.startsWith('/api/cta') || pathname.startsWith('/api/popups')) return isWrite ? 'leads.edit_status' : 'leads.view';
  if (pathname.startsWith('/api/legal')) return `pages.${action}`;
  if (pathname.startsWith('/api/team')) return `pages.${action}`;
  if (pathname.startsWith('/api/activity-logs') || pathname.startsWith('/api/login-history')) return 'security.view';
  if (pathname.startsWith('/api/page-content')) return isWrite ? 'pages.edit' : 'pages.view';
  if (pathname.startsWith('/api/upload')) return 'media.upload';
  if (pathname.startsWith('/api/visitors')) return 'analytics.view';
  if (pathname.startsWith('/api/projects')) return isWrite ? 'settings.edit' : 'settings.view';

  return null; // No specific permission check required
}

function addCorsHeaders(response, pathname) {
  if (pathname && pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization, ngrok-skip-browser-warning');
  }
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; font-src 'self' data: *; img-src 'self' data: blob: *; connect-src 'self' *; frame-src 'self' http://localhost:3000 http://localhost:3001;");
  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  console.log('[MIDDLEWARE] Path:', pathname, 'Method:', request.method);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization, ngrok-skip-browser-warning',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 1. Bypass internal requests to prevent recursion
  if (request.headers.get('x-internal-bypass') === 'true') {
    return NextResponse.next();
  }

  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

  // 2. Check if IP is blocked
  if (await isIpBlocked(request, ip)) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden: IP Address Blocked' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Rate limiting for login
  if (pathname === '/api/auth/login') {
    const limitResult = rateLimit(`login:${ip}`, 5, 60000);
    if (!limitResult.ok) {
      return new NextResponse(JSON.stringify({ error: 'Too many login attempts. Please try again later.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((limitResult.reset - Date.now()) / 1000).toString(),
        },
      });
    }
  }

  const tokenCookie = request.cookies.get('auth-token');
  let token = tokenCookie?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  // 4. API Routes Security
  if (pathname.startsWith('/api/')) {
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/verify-2fa',
      '/api/sync/',
      '/api/websites/connect',
      '/api/sitemap',
      '/api/visitors/track',
      '/api/visitors/stream',
      '/api/seo/by-slug/',
      '/api/pages/by-slug/',
      '/api/cta/public',
      '/api/popups/public',
      '/api/team/public',
      '/api/redirects/public',
      '/api/navigation/public',
      '/api/faqs/public',
    ];

    const publicReadPaths = [
      '/api/homepage',
      '/api/blogs/public',
      '/api/pages/public',
      '/api/search',
      '/api/global-settings/header',
      '/api/global-settings/footer',
      '/api/navigation',
      '/api/global-settings',
    ];

    if (publicPaths.some(p => pathname.startsWith(p))) {
      return addCorsHeaders(NextResponse.next(), pathname);
    }

    if (request.method === 'GET' && publicReadPaths.some(p => pathname.startsWith(p))) {
      return addCorsHeaders(NextResponse.next(), pathname);
    }

    // Bypass if has valid API Key (SDK calls)
    const hasApiKey = request.headers.get('x-api-key');
    if (hasApiKey) {
      return addCorsHeaders(NextResponse.next(), pathname);
    }

    const user = decodeToken(token);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check fine-grained API permission
    const requiredPermission = getRequiredApiPermission(pathname, request.method);
    if (requiredPermission) {
      const userPermissions = user.permissions || [];
      const userRole = user.role || '';

      // Super Admin bypasses all checks
      if (userRole !== 'Super Admin' && !userPermissions.includes(requiredPermission)) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden: Insufficient Permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  // 5. Protect dashboard and admin pages under /admin namespace
  if (pathname === '/home') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (pathname.startsWith('/admin')) {
    // Public auth routes under /admin do not require authentication
    const publicAuthPaths = [
      '/admin/login',
      '/admin/register',
      '/admin/forgot-password',
      '/admin/reset-password',
      '/admin/unauthorized'
    ];

    if (publicAuthPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const user = decodeToken(token);
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const userPermissions = user.permissions || [];
    const userRole = user.role || '';

    // Client User → user-dashboard only
    if (pathname.startsWith('/admin') && !pathname.includes('/user-dashboard') && userRole === 'Client User') {
      return NextResponse.redirect(new URL('/admin/user-dashboard', request.url));
    }

    // Non-client users visiting /user-dashboard → redirect to /admin/dashboard
    if (pathname.includes('/user-dashboard') && userRole !== 'Client User') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Check page-level permission for dashboard pages
    if (pathname.startsWith('/admin/')) {
      const requiredPermission = getRequiredPagePermission(pathname.replace('/admin', '/dashboard'));
      // Super Admin bypasses all checks
      if (userRole !== 'Super Admin' && requiredPermission && !userPermissions.includes(requiredPermission)) {
        return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
      }
    }
  }

  const response = NextResponse.next();
  return addCorsHeaders(response, pathname);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
