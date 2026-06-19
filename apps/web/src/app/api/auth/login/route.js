import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

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
        },
      });
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'FAILED_LOGIN_ATTEMPT',
          details: `Failed login attempt for user: ${email}`,
        },
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Log successful login
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        success: true,
      },
    });
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: `User logged in: ${email}`,
      },
    });

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json({
        success: true,
        requires2FA: true,
        email: user.email,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const response = NextResponse.json({
      success: true,
      role: user.role,
      redirectUrl: user.role === 'admin' ? '/dashboard' : '/user-dashboard',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}