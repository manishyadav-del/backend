import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const menus = await prisma.navigation.findMany({
    where: { projectId },
    orderBy: { location: 'asc' },
  });

  return NextResponse.json({ menus });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { projectId, location, items } = body;

  const menu = await prisma.navigation.create({
    data: {
      projectId,
      location,
      items: JSON.stringify(items),
    },
  });

  return NextResponse.json({ menu });
}