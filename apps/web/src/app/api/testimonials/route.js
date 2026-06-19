import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const testimonials = await prisma.testimonial.findMany({
    where: { projectId },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ testimonials });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { projectId, clientName, clientImage, rating, content, isVisible, sortOrder } = body;

  const testimonial = await prisma.testimonial.create({
    data: {
      projectId,
      clientName,
      clientImage,
      rating: rating || 5,
      content,
      isVisible: isVisible ?? true,
      sortOrder: sortOrder || 0,
    },
  });

  return NextResponse.json({ testimonial });
}