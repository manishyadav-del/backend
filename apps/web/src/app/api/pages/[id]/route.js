import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/pages/[id] - Get single page with sections
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        seo: true,
        sections_rel: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' }
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 10
        },
        drafts: {
          orderBy: { updatedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Get page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/pages/[id] - Update page
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();
    const { title, slug, status, banner, template, isHome, visibility, password, seo, changeLog } = body;

    const page = await prisma.page.findUnique({
      where: { id },
      include: { versions: true }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== page.slug) {
      const existing = await prisma.page.findFirst({
        where: {
          projectId: page.projectId,
          slug,
          id: { not: id }
        }
      });

      if (existing) {
        return NextResponse.json({ error: 'Page with this slug already exists' }, { status: 400 });
      }
    }

    // Update page
    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(status && { status }),
        ...(banner !== undefined && { banner }),
        ...(template !== undefined && { template }),
        ...(isHome !== undefined && { isHome }),
        ...(visibility && { visibility }),
        ...(password !== undefined && { password }),
        ...(status === 'published' && { publishedAt: new Date() }),
        ...(seo && {
          seo: {
            upsert: {
              create: seo,
              update: seo
            }
          }
        })
      },
      include: {
        seo: true,
        sections_rel: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    // Create new version if significant changes
    if (title || slug || status === 'published') {
      const nextVersion = (page.versions?.[0]?.version || 0) + 1;
      
      await prisma.pageVersion.create({
        data: {
          pageId: id,
          version: nextVersion,
          title: updatedPage.title,
          slug: updatedPage.slug,
          content: updatedPage.content,
          sections: updatedPage.sections,
          banner: updatedPage.banner,
          seo: seo ? JSON.stringify(seo) : null,
          changeLog: changeLog || 'Page updated',
          createdBy: user.id
        }
      });
    }

    return NextResponse.json({ page: updatedPage });
  } catch (error) {
    console.error('Update page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/pages/[id] - Delete page
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    await prisma.page.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}