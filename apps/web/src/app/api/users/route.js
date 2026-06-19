import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// Helper to log activity
async function logActivity(userId, action, entity, entityId, details) {
  await prisma.activityLog.create({
    data: { userId, action, entity, entityId, details },
  });
}

// GET all users
export async function GET(request) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      twoFactorEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ users });
}

// CREATE user
export async function POST(request) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { email, password, name, role } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || 'viewer',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      twoFactorEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await logActivity(authUser.id, 'user.created', 'User', user.id, `Created user ${email}`);

  return NextResponse.json({ user }, { status: 201 });
}