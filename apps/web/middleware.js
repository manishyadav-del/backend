import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes — check for JWT cookie
  if (pathname.startsWith('/projects') || pathname === '/') {
    const token = request.cookies.get('auth-token');
    
    // In Phase 1 scaffold, we might bypass this for easy testing,
    // but here is the actual check
    if (!token && process.env.NODE_ENV === 'production') {
       return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
