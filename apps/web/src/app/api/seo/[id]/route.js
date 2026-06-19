import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/seo/[id] - Get single SEO entry
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const seo = await prisma.sEO.findUnique({
      where: { id },
      include: {
        page: {
          select: { id: true, title: true, slug: true }
        }
      }
    });

    if (!seo) {
      return NextResponse.json({ error: 'SEO entry not found' }, { status: 404 });
    }

    return NextResponse.json({ seo });
  } catch (error) {
    console.error('Get SEO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/seo/[id] - Update SEO entry
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();
    const { metaTitle, metaDescription, urlSlug, canonical, ogImage, robots, llmTxt } = body;

    const seo = await prisma.sEO.findUnique({
      where: { id },
    });

    if (!seo) {
      return NextResponse.json({ error: 'SEO entry not found' }, { status: 404 });
    }

    const updatedSeo = await prisma.sEO.update({
      where: { id },
      data: {
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(urlSlug !== undefined && { urlSlug }),
        ...(canonical !== undefined && { canonical }),
        ...(ogImage !== undefined && { ogImage }),
        ...(robots !== undefined && { robots }),
        ...(llmTxt !== undefined && { llmTxt }),
      },
    });

    return NextResponse.json({ seo: updatedSeo });
  } catch (error) {
    console.error('Update SEO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/seo/[id] - Delete SEO entry
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    await prisma.sEO.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete SEO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}