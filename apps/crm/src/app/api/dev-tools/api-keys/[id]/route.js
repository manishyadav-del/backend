import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function PUT(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { name, isActive, permissions } = body;

  const apiKey = await prisma.apiKey.update({
    where: { id },
    data: { name, isActive, permissions: permissions ? JSON.stringify(permissions) : undefined },
  });

  return NextResponse.json({ apiKey });
}

export async function DELETE(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await prisma.apiKey.delete({ where: { id } });

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'apikey.deleted', entity: 'ApiKey', entityId: id, details: 'API key revoked' },
  });

  return NextResponse.json({ success: true });
}
