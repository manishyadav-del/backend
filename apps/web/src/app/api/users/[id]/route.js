import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

async function logActivity(userId, action, entity, entityId, details) {
  await prisma.activityLog.create({
    data: { userId, action, entity, entityId, details },
  });
}

// GET single user
export async function GET(request, { params }) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
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

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// UPDATE user
export async function PUT(request, { params }) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, role, password, twoFactorEnabled, twoFactorSecret } = body;

  const existingUser = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (role !== undefined) updateData.role = role;
  if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;
  if (twoFactorSecret !== undefined) updateData.twoFactorSecret = twoFactorSecret;
  if (email !== undefined && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
    updateData.email = email;
  }
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
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

  await logActivity(authUser.id, 'user.updated', 'User', user.id, `Updated user ${user.email}`);

  return NextResponse.json({ user });
}

// DELETE user
export async function DELETE(request, { params }) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authUser.id === params.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: params.id } });

  await logActivity(authUser.id, 'user.deleted', 'User', params.id, `Deleted user ${user.email}`);

  return NextResponse.json({ success: true });
}