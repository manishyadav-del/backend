import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const type = searchParams.get('type');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const where = { projectId };
  if (type) where.type = type;

  const ctas = await prisma.cTA.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ ctas });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { projectId, title, buttonText, link, type, placement, isActive, sortOrder, bgColor, textColor } = body;

    if (!projectId || !title || !buttonText) {
      return NextResponse.json({ error: 'Project ID, title, and button text are required' }, { status: 400 });
    }

    const cta = await prisma.cTA.create({
      data: { projectId, title, buttonText, link, type: type || 'button', placement: placement || 'global', isActive: isActive ?? true, sortOrder: sortOrder || 0, bgColor, textColor },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'cta.created', entity: 'CTA', entityId: cta.id, details: `Created CTA: ${title}` },
    });

    return NextResponse.json({ cta }, { status: 201 });
  } catch (error) {
    console.error('Create CTA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
