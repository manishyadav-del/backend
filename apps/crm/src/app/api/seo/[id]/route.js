import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/seo/[id] - Get single SEO entry (id is the Page ID)
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        seo: true,
        schema: true,
      }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const pageRedirect = await prisma.redirect.findFirst({
      where: {
        projectId: page.projectId,
        fromPath: '/' + page.slug
      }
    });

    const seo = {
      pageId: id,
      metaTitle: page.seo?.metaTitle || '',
      metaDescription: page.seo?.metaDescription || '',
      urlSlug: page.seo?.urlSlug || page.slug,
      canonical: page.seo?.canonical || '',
      ogImage: page.seo?.ogImage || '',
      robots: page.seo?.robots || 'index, follow',
      llmTxt: page.seo?.llmTxt || '',
      schemaMarkup: page.schema?.[0]?.content || '',
      redirectPath: pageRedirect?.toPath || '',
      inSitemap: page.status === 'published',
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug
      }
    };

    return NextResponse.json({ seo });
  } catch (error) {
    console.error('Get SEO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/seo/[id] - Update or create SEO entry (id is the Page ID)
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params; // Page ID
    const body = await request.json();
    const { metaTitle, metaDescription, urlSlug, canonical, ogImage, robots, llmTxt, schemaMarkup, redirectPath } = body;

    const page = await prisma.page.findUnique({
      where: { id },
      include: { seo: true }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // 1. Update Core SEO Model
    const updatedSeo = await prisma.sEO.upsert({
      where: { pageId: id },
      update: {
        metaTitle,
        metaDescription,
        urlSlug,
        canonical,
        ogImage,
        robots,
        llmTxt
      },
      create: {
        pageId: id,
        metaTitle,
        metaDescription,
        urlSlug,
        canonical,
        ogImage,
        robots,
        llmTxt
      }
    });

    // 2. Update Schema Markup Model
    if (schemaMarkup !== undefined) {
      const existingSchema = await prisma.schemaMarkup.findFirst({
        where: { pageId: id }
      });
      if (schemaMarkup.trim()) {
        if (existingSchema) {
          await prisma.schemaMarkup.update({
            where: { id: existingSchema.id },
            data: { content: schemaMarkup }
          });
        } else {
          await prisma.schemaMarkup.create({
            data: { pageId: id, content: schemaMarkup }
          });
        }
      } else if (existingSchema) {
        await prisma.schemaMarkup.delete({
          where: { id: existingSchema.id }
        });
      }
    }

    // 3. Update Redirect Model
    if (redirectPath !== undefined) {
      const fromPath = '/' + page.slug;
      const existingRedirect = await prisma.redirect.findFirst({
        where: {
          projectId: page.projectId,
          fromPath
        }
      });
      if (redirectPath.trim()) {
        if (existingRedirect) {
          await prisma.redirect.update({
            where: { id: existingRedirect.id },
            data: { toPath: redirectPath }
          });
        } else {
          await prisma.redirect.create({
            data: {
              projectId: page.projectId,
              fromPath,
              toPath: redirectPath,
              type: '301'
            }
          });
        }
      } else if (existingRedirect) {
        await prisma.redirect.delete({
          where: { id: existingRedirect.id }
        });
      }
    }

    return NextResponse.json({ seo: updatedSeo });
  } catch (error) {
    console.error('Update SEO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/seo/[id] - Delete SEO entry (id is the Page ID)
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await prisma.sEO.delete({
      where: { pageId: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete SEO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}