import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const popups = await prisma.popup.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ popups });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { projectId, title, content, type, trigger, delay, isActive, buttonText, buttonLink, image } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'Project ID and title are required' }, { status: 400 });
    }

    const popup = await prisma.popup.create({
      data: { projectId, title, content, type: type || 'info', trigger: trigger || 'exit', delay: delay || 5, isActive: isActive ?? true, buttonText, buttonLink, image },
    });

    return NextResponse.json({ popup }, { status: 201 });
  } catch (error) {
    console.error('Create popup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
