import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/pages/[id]/drafts - Get all drafts for a page
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const drafts = await prisma.pageDraft.findMany({
      where: { pageId: id },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Get drafts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pages/[id]/drafts - Save draft
export async function POST(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}
    const { title, slug, content, sections, banner, seo, changeLog } = body;

    const page = await prisma.page.findUnique({
      where: { id }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const draft = await prisma.pageDraft.create({
      data: {
        pageId: id,
        title: title || page.title,
        slug: slug || page.slug,
        content: content ? JSON.stringify(content) : page.content,
        sections: sections ? JSON.stringify(sections) : page.sections,
        banner: banner !== undefined ? banner : page.banner,
        seo: seo ? JSON.stringify(seo) : (page.seo ? JSON.stringify(page.seo) : null),
        changeLog: changeLog || 'Draft saved',
        createdBy: user.id
      }
    });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    console.error('Save draft error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}