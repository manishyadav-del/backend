import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { signToken, resolveUserRoles, resolveUserPermissions } from '@/lib/auth.js';
import { logAuditEvent } from '@/lib/auditLog.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

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

    // Resolve DB-driven role and permissions
    const roles = await resolveUserRoles(user.id);
    const primaryRole = roles[0] || 'Client User';
    const userPermissions = await resolveUserPermissions(user.id);

    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN_2FA',
      module: 'auth',
      ipAddress: ip,
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: primaryRole,
      permissions: userPermissions,
    });

    const redirectUrl = '/home';

    const response = NextResponse.json({ 
      success: true, 
      role: primaryRole,
      permissions: userPermissions,
      redirectUrl,
      user: { id: user.id, email: user.email, role: primaryRole } 
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