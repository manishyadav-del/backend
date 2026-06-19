import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const pages = await prisma.legalPage.findMany({
    where: { projectId },
    orderBy: { type: 'asc' },
  });

  return NextResponse.json({ pages });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { projectId, type, title, content } = body;

  const page = await prisma.legalPage.create({
    data: {
      projectId,
      type,
      title,
      content,
    },
  });

  return NextResponse.json({ page });
}