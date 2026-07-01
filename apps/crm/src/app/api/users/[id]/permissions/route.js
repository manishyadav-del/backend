import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';
import { logAuditEvent } from '@/lib/auditLog.js';

// GET /api/users/[id]/permissions — View user's permission overrides
export async function GET(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const overrides = await prisma.userPermission.findMany({
    where: { userId: params.id },
    include: { permission: true }
  });

  return NextResponse.json({ overrides });
}

// POST /api/users/[id]/permissions — Set/update user permission overrides
export async function POST(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Only Super Admin can change Super Admin permissions
  if (targetUser.role === 'Super Admin' && user.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Only Super Admin can edit Super Admin permissions' }, { status: 403 });
  }

  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  // overrides: [{ permissionId: string, value: boolean }]
  const { overrides = [] } = await request.json();

  for (const override of overrides) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: params.id,
          permissionId: override.permissionId
        }
      },
      update: { value: override.value },
      create: {
        userId: params.id,
        permissionId: override.permissionId,
        value: override.value
      }
    });
  }

  await logAuditEvent({
    userId: user.id,
    action: 'USER_PERMISSIONS_UPDATED',
    module: 'users',
    ipAddress: ip
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/users/[id]/permissions — Remove a specific override
export async function DELETE(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Only Super Admin can change Super Admin permissions
  if (targetUser.role === 'Super Admin' && user.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Only Super Admin can edit Super Admin permissions' }, { status: 403 });
  }

  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const { permissionId } = await request.json();

  await prisma.userPermission.deleteMany({
    where: {
      userId: params.id,
      permissionId
    }
  });

  await logAuditEvent({
    userId: user.id,
    action: 'USER_PERMISSION_OVERRIDE_REMOVED',
    module: 'users',
    ipAddress: ip
  });

  return NextResponse.json({ success: true });
}
