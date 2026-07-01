import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, resolveUserPermissions } from '@/lib/auth.js';
import { logAuditEvent } from '@/lib/auditLog.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['user', 'client', 'content_creator', 'author', 'contributor'];
    const selectedRole = validRoles.includes(role) ? role : 'user';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with role and default status
    const user = await prisma.user.create({
      data: {
        name: name || null,
        email: normalizedEmail,
        password: hashedPassword,
        role: selectedRole,
        status: 'active',
        avatar: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log registration activity
    await logAuditEvent({
      userId: user.id,
      action: 'USER_REGISTERED',
      module: 'auth',
      details: `New user registered with role: ${selectedRole}`,
    });

    // Resolve permissions for the role
    const userPermissions = await resolveUserPermissions(user.id);

    // Generate JWT token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: selectedRole,
      permissions: userPermissions,
    });

    const redirectUrl = '/home';

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: selectedRole,
        status: user.status,
        avatar: user.avatar,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });

    // Set auth cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Something went wrong during registration' }, { status: 500 });
  }
}