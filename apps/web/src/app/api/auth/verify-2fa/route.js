import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // For demo purposes, accept any 6-digit code
    // In production, use speakeasy or similar library
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
    }

    const { signToken } = await import('@/lib/auth.js');
    const token = signToken({ id: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({ 
      success: true, 
      role: user.role,
      redirectUrl: user.role === 'admin' ? '/dashboard' : '/user-dashboard',
      user: { id: user.id, email: user.email, role: user.role } 
    });

    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}