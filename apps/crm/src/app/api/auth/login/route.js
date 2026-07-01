import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, resolveUserRoles, resolveUserPermissions } from '@/lib/auth.js';
import { logAuditEvent } from '@/lib/auditLog.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      // Log failed login attempt
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          success: false,
          ip: ip,
        },
      });
      await logAuditEvent({
        userId: user.id,
        action: 'FAILED_LOGIN',
        module: 'auth',
        ipAddress: ip,
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json({
        success: true,
        requires2FA: true,
        email: user.email,
      });
    }

    // Fetch DB role and permissions
    const roles = await resolveUserRoles(user.id);
    const primaryRole = roles[0] || 'Client User';
    const userPermissions = await resolveUserPermissions(user.id);

    // Log successful login
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        success: true,
        ip: ip,
      },
    });
    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN',
      module: 'auth',
      ipAddress: ip,
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: primaryRole,
      permissions: userPermissions,
    });

    const redirectUrl = '/admin';

    const response = NextResponse.json({
      success: true,
      role: primaryRole,
      permissions: userPermissions,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: primaryRole,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 5,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}