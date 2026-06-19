import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const members = await prisma.teamMember.findMany({
    where: { projectId },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ members });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { projectId, name, role, photo, bio, socialLinks, sortOrder, isVisible } = body;

  const member = await prisma.teamMember.create({
    data: {
      projectId,
      name,
      role,
      photo,
      bio,
      socialLinks,
      sortOrder: sortOrder || 0,
      isVisible: isVisible ?? true,
    },
  });

  return NextResponse.json({ member });
}