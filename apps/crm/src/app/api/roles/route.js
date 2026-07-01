import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';
import { logAuditEvent } from '@/lib/auditLog.js';

// GET /api/roles — List all roles with their permissions
export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true }
      },
      _count: { select: { users: true } }
    },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json({ roles });
}

// POST /api/roles — Create a new role
export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  const { name, description, permissionIds = [] } = await request.json();
  if (!name) return NextResponse.json({ error: 'Role name is required' }, { status: 400 });

  const role = await prisma.role.create({
    data: {
      name,
      description,
      permissions: {
        create: permissionIds.map((id) => ({ permissionId: id }))
      }
    },
    include: {
      permissions: { include: { permission: true } }
    }
  });

  await logAuditEvent({ userId: user.id, action: 'ROLE_CREATED', module: 'roles', ipAddress: ip });

  return NextResponse.json({ role }, { status: 201 });
}
