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
      roles: {
        include: { role: true },
      },
    },
  });

  // Flatten roles to a simple roles array per user
  const usersWithRoles = users.map((u) => ({
    ...u,
    roles: u.roles.map((ur) => ur.role),
  }));

  return NextResponse.json({ users: usersWithRoles });
}


// CREATE user
export async function POST(request) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { email, password, name, roleId } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
  }

  // Validate role
  let role = null;
  if (roleId) {
    role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
  }

  // Only Super Admin can assign the Super Admin role
  if (role?.name === 'Super Admin' && authUser.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Only Super Admin can assign the Super Admin role' }, { status: 403 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role?.name || 'viewer',
      // Assign RBAC role via relation
      ...(role && {
        roles: {
          create: [{ roleId: role.id }],
        },
      }),
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