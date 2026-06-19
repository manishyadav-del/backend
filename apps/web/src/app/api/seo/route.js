import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/seo - List all SEO entries for a project
export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

    const seo = await prisma.sEO.findMany({
      where: {
        page: { projectId }
      },
      include: {
        page: {
          select: { id: true, title: true, slug: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ seo });
  } catch (error) {
    console.error('Get SEO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}