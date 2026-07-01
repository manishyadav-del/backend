import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';
import { logAuditEvent } from '@/lib/auditLog.js';

// GET /api/users/[id]/roles — Get all roles assigned to a user
export async function GET(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userRoles = await prisma.userRole.findMany({
    where: { userId: params.id },
    include: { role: true },
  });

  return NextResponse.json({ roles: userRoles.map((ur) => ur.role) });
}

// POST /api/users/[id]/roles — Assign roles to a user (replaces all existing)
export async function POST(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  const { roleIds = [] } = await request.json();

  if (!Array.isArray(roleIds)) {
    return NextResponse.json({ error: 'roleIds must be an array' }, { status: 400 });
  }

  // Validate all role IDs exist
  const roles = await prisma.role.findMany({
    where: { id: { in: roleIds } },
  });

  if (roles.length !== roleIds.length) {
    return NextResponse.json({ error: 'One or more roles not found' }, { status: 404 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Only Super Admin can change Super Admin roles
  if (targetUser.role === 'Super Admin' && user.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Only Super Admin can edit Super Admin roles' }, { status: 403 });
  }

  // Only Super Admin can assign the Super Admin role
  const hasSuperAdminRole = roles.some((r) => r.name === 'Super Admin');
  if (hasSuperAdminRole && user.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Only Super Admin can assign the Super Admin role' }, { status: 403 });
  }

  // Replace all existing role assignments
  await prisma.userRole.deleteMany({ where: { userId: params.id } });

  if (roleIds.length > 0) {
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId: params.id, roleId })),
      skipDuplicates: true,
    });
  }

  // Keep the user.role string field in sync with primary role name (for legacy compat)
  const primaryRole = roles[0]?.name || 'viewer';
  await prisma.user.update({
    where: { id: params.id },
    data: { role: primaryRole },
  });

  await logAuditEvent({
    userId: user.id,
    action: 'USER_ROLES_ASSIGNED',
    module: 'users',
    ipAddress: ip,
  });

  return NextResponse.json({ success: true, roles });
}
