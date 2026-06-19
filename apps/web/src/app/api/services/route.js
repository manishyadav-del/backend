import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

    const services = await prisma.service.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { projectId, title, description, image, ctaText, ctaLink, sortOrder, isVisible, faqIds } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'Project ID and title are required' }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        projectId,
        title,
        description,
        image,
        ctaText,
        ctaLink,
        sortOrder: sortOrder || 0,
        isVisible: isVisible ?? true,
      },
    });

    if (faqIds && faqIds.length > 0) {
      await prisma.fAQ.updateMany({
        where: { id: { in: faqIds } },
        data: { serviceId: service.id },
      });
    }

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}