import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const contacts = await prisma.contact.findMany({
    where: { projectId },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ contacts });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { projectId, type, label, value, icon, sortOrder } = body;

  const contact = await prisma.contact.create({
    data: {
      projectId,
      type,
      label,
      value,
      icon,
      sortOrder: sortOrder || 0,
    },
  });

  return NextResponse.json({ contact });
}