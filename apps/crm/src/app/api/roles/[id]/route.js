import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';
import { logAuditEvent } from '@/lib/auditLog.js';

// GET /api/roles/[id]
export async function GET(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await prisma.role.findUnique({
    where: { id: params.id },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } }
    }
  });

  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

  return NextResponse.json({ role });
}

// PUT /api/roles/[id] — Update role and its permissions
export async function PUT(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  const { name, description, permissionIds } = await request.json();

  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;

  if (permissionIds) {
    // Replace all permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: params.id } });
    updateData.permissions = {
      create: permissionIds.map((id) => ({ permissionId: id }))
    };
  }

  const role = await prisma.role.update({
    where: { id: params.id },
    data: updateData,
    include: { permissions: { include: { permission: true } } }
  });

  await logAuditEvent({ userId: user.id, action: 'ROLE_UPDATED', module: 'roles', ipAddress: ip });

  return NextResponse.json({ role });
}

// DELETE /api/roles/[id]
export async function DELETE(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  await prisma.role.delete({ where: { id: params.id } });

  await logAuditEvent({ userId: user.id, action: 'ROLE_DELETED', module: 'roles', ipAddress: ip });

  return NextResponse.json({ success: true });
}
