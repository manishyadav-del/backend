import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserRoles, resolveUserPermissions } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
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

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Resolve DB-driven roles and permissions
  const roles = await resolveUserRoles(dbUser.id);
  const permissions = await resolveUserPermissions(dbUser.id);

  return NextResponse.json({ 
    user: {
      ...dbUser,
      roles,
      permissions,
    }
  });
}