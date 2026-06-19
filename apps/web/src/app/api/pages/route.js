import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKey.js';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/pages - List all pages
export async function GET(request) {
  try {
    let projectId = null;

    const projectViaKey = await validateApiKey(request);
    if (projectViaKey) {
      projectId = projectViaKey.id;
    } else {
      const user = getAuthUser(request);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      const url = new URL(request.url);
      projectId = url.searchParams.get('projectId');
      if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const pages = await prisma.page.findMany({
      where: { projectId },
      include: {
        seo: true,
        sections_rel: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: { versions: true, drafts: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('List pages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pages - Create new page
export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { projectId, title, slug, status = 'draft', template, isHome = false } = body;

    if (!projectId || !title || !slug) {
      return NextResponse.json({ error: 'Project ID, title, and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await prisma.page.findFirst({
      where: { projectId, slug }
    });

    if (existing) {
      return NextResponse.json({ error: 'Page with this slug already exists' }, { status: 400 });
    }

    const page = await prisma.page.create({
      data: {
        projectId,
        title,
        slug,
        status,
        template,
        isHome,
        authorId: user.id,
      },
      include: {
        seo: true,
        sections_rel: true
      }
    });

    // Create initial version
    await prisma.pageVersion.create({
      data: {
        pageId: page.id,
        version: 1,
        title: page.title,
        slug: page.slug,
        changeLog: 'Initial page creation',
        createdBy: user.id
      }
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Create page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}