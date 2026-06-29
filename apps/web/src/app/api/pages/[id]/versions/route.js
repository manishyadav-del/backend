import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/pages/[id]/versions - Get version history
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params ? await params : {};

    const versions = await prisma.pageVersion.findMany({
      where: { pageId: id },
      orderBy: { version: 'desc' },
      take: 50
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pages/[id]/versions - Create new version
export async function POST(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params ? await params : {};
    const body = await request.json();
    const { changeLog } = body;

    const page = await prisma.page.findUnique({
      where: { id },
      include: { versions: true }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const nextVersion = (page.versions?.[0]?.version || 0) + 1;

    const version = await prisma.pageVersion.create({
      data: {
        pageId: id,
        version: nextVersion,
        title: page.title,
        slug: page.slug,
        content: page.content,
        sections: page.sections,
        banner: page.banner,
        seo: page.seo ? JSON.stringify(page.seo) : null,
        changeLog: changeLog || 'Manual version created',
        createdBy: user.id
      }
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error('Create version error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}