import { NextResponse } from 'next/server';
import { validateApiKey, unauthorizedResponse } from '@/lib/apiKey.js';
import { prisma } from '@/lib/prisma.js';
import { PAGE_STATUSES } from '@/lib/constants.js';

export async function GET(request) {
  try {
    const project = await validateApiKey(request);
    if (!project) return unauthorizedResponse();

    const pages = await prisma.page.findMany({
      where: {
        projectId: project.id,
        status: PAGE_STATUSES.PUBLISHED
      },
      select: {
        slug: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ pages, domain: project.domain });
  } catch (error) {
    console.error('Get sitemap error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
