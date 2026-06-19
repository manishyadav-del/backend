import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// POST /api/pages/[id]/versions/[versionId]/rollback - Rollback to a specific version
export async function POST(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, versionId } = params;
    const body = await request.json();
    const { changeLog } = body;

    const version = await prisma.pageVersion.findFirst({
      where: {
        id: versionId,
        pageId: id
      }
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const page = await prisma.page.findUnique({
      where: { id },
      include: { versions: true }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Create a new version before rollback (backup current state)
    const nextVersion = (page.versions?.[0]?.version || 0) + 1;
    
    await prisma.pageVersion.create({
      data: {
        pageId: id,
        version: nextVersion,
        title: page.title,
        slug: page.slug,
        content: page.content,
        sections: page.sections,
        banner: page.banner,
        seo: page.seo ? JSON.stringify(page.seo) : null,
        changeLog: `Backup before rollback to v${version.version}`,
        createdBy: user.id
      }
    });

    // Rollback page to the selected version
    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        title: version.title,
        slug: version.slug,
        content: version.content,
        sections: version.sections,
        banner: version.banner
      },
      include: {
        seo: true,
        sections_rel: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    // Create rollback version
    const rollbackVersion = (page.versions?.[0]?.version || 0) + 2;
    
    await prisma.pageVersion.create({
      data: {
        pageId: id,
        version: rollbackVersion,
        title: updatedPage.title,
        slug: updatedPage.slug,
        content: updatedPage.content,
        sections: updatedPage.sections,
        banner: updatedPage.banner,
        seo: version.seo,
        changeLog: changeLog || `Rolled back to version ${version.version}`,
        createdBy: user.id
      }
    });

    return NextResponse.json({ page: updatedPage });
  } catch (error) {
    console.error('Rollback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/pages/[id]/versions/[versionId] - Get specific version
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, versionId } = params;

    const version = await prisma.pageVersion.findFirst({
      where: {
        id: versionId,
        pageId: id
      }
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error('Get version error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}