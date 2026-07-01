import { NextResponse } from 'next/server';
import { validateApiKey, unauthorizedResponse } from '@/lib/apiKey.js';
import prisma from '@/lib/prisma.js';
import { PAGE_STATUSES } from '@/lib/constants.js';

export async function POST(request) {
  try {
    const project = await validateApiKey(request);
    if (!project) return unauthorizedResponse();

    const body = await request.json();
    const { routes } = body; // Expects array of { slug, isDynamic }

    if (!Array.isArray(routes)) {
      return NextResponse.json({ error: 'Invalid manifest format' }, { status: 400 });
    }

    const syncTime = new Date();
    const incomingSlugs = routes.map(r => r.slug);

    // 1. Process incoming routes (upsert)
    for (const route of routes) {
      await prisma.page.upsert({
        where: {
          projectId_slug: { projectId: project.id, slug: route.slug }
        },
        update: {
          title: route.title || route.name || undefined,
          template: route.layout || undefined,
          isHome: route.slug === '/' || route.slug === '',
        },
        create: {
          projectId: project.id,
          slug: route.slug,
          title: route.title || route.name || route.slug || 'Untitled Page',
          template: route.layout || null,
          isHome: route.slug === '/' || route.slug === '',
          status: PAGE_STATUSES.DRAFT,
        }
      });
    }

    // 2. Archive pages that are no longer in the manifest
    await prisma.page.updateMany({
      where: {
        projectId: project.id,
        slug: { notIn: incomingSlugs },
        status: { not: PAGE_STATUSES.ARCHIVED }
      },
      data: {
        status: PAGE_STATUSES.ARCHIVED
      }
    });

    return NextResponse.json({ 
      success: true, 
      syncedCount: routes.length,
      timestamp: syncTime 
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
