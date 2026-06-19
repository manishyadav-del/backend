import { NextResponse } from 'next/server';
import { rateLimit } from './src/lib/rateLimit.js';
import { checkPermission, getRequiredResourceForPath } from './src/lib/auth.js';

// Blocked IPs Cache
let cachedBlockedIps = null;
let lastCacheFetch = 0;
const CACHE_TTL = 10000; // 10 seconds

async function isIpBlocked(request, ip) {
  if (request.headers.get('x-internal-bypass') === 'true') {
    return false;
  }
  const now = Date.now();
  if (!cachedBlockedIps || (now - lastCacheFetch > CACHE_TTL)) {
    try {
      const fetchUrl = new URL('/api/security/ip-block?projectId=default', request.url);
      const res = await fetch(fetchUrl, {
        headers: {
          'x-internal-bypass': 'true'
        }
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

// Helper to decode JWT from cookie without external library
function decodeToken(tokenValue) {
  try {
    const payload = tokenValue.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

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
    const limitResult = rateLimit(`login:${ip}`, 5, 60000); // 5 attempts per minute
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
  const token = tokenCookie?.value;

  // 4. API Routes Security
  if (pathname.startsWith('/api/')) {
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/sync/',
      '/api/sitemap',
      '/api/visitors/track',
      '/api/visitors/stream',
      '/api/seo/by-slug/',
      '/api/pages/by-slug/',
    ];
    
    if (publicPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    
    // Bypass if has valid API Key (SDK calls)
    const hasApiKey = request.headers.get('x-api-key') || request.headers.get('Authorization')?.startsWith('Bearer ');
    if (hasApiKey) {
      return NextResponse.next();
    }
    
    const user = decodeToken(token);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    let resource = null;
    if (pathname.startsWith('/api/users')) resource = 'users';
    else if (pathname.startsWith('/api/security')) resource = 'security';
    else if (
      pathname.startsWith('/api/dev-tools') || 
      pathname.startsWith('/api/performance') || 
      pathname.startsWith('/api/backup') ||
      pathname.startsWith('/api/email-settings') || 
      pathname.startsWith('/api/global-settings')
    ) resource = 'settings';
    else if (
      pathname.startsWith('/api/services') || 
      pathname.startsWith('/api/redirects') || 
      pathname.startsWith('/api/navigation')
    ) resource = 'services';
    else if (
      pathname.startsWith('/api/pages') || 
      pathname.startsWith('/api/blogs') || 
      pathname.startsWith('/api/media') || 
      pathname.startsWith('/api/faqs') || 
      pathname.startsWith('/api/testimonials') || 
      pathname.startsWith('/api/team') || 
      pathname.startsWith('/api/contacts')
    ) resource = 'content';
    else if (
      pathname.startsWith('/api/leads') || 
      pathname.startsWith('/api/forms')
    ) resource = 'leads';
    
    if (resource) {
      const action = request.method === 'GET' ? 'read' : 'write';
      const allowed = checkPermission(user.role, resource, action);
      if (!allowed) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden: Insufficient Permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  // 5. Protect dashboard pages
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/projects') || pathname.startsWith('/user-dashboard')) {
    if (pathname === '/dashboard/unauthorized') {
      return NextResponse.next();
    }

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const user = decodeToken(token);
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // If admin is visiting user-dashboard, redirect them to admin dashboard
    if (pathname.startsWith('/user-dashboard') && user.role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect root /dashboard page for non-admins to user-dashboard
    if (pathname === '/dashboard' && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/user-dashboard', request.url));
    }

    // Check permissions for the requested page path
    const resource = getRequiredResourceForPath(pathname);
    const allowed = checkPermission(user.role, resource, 'read');
    if (!allowed) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }



  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; font-src 'self' data: *; img-src 'self' data: blob: *; connect-src 'self' *;");

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
