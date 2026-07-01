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

    const [pages, schemaMarkups, redirects] = await Promise.all([
      prisma.page.findMany({
        where: {
          projectId,
          status: { not: 'archived' }
        },
        include: {
          seo: true
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.schemaMarkup.findMany({
        where: {
          page: { projectId }
        }
      }),
      prisma.redirect.findMany({
        where: { projectId }
      })
    ]);

    // Format for the frontend so it expects pages with structured SEO
    const seoList = pages.map(page => {
      const pageSchema = schemaMarkups.find(sm => sm.pageId === page.id);
      const pageRedirect = redirects.find(r => r.fromPath === '/' + page.slug);
      
      return {
        id: page.id, // Page ID used for upserting
        pageTitle: page.title,
        pageSlug: page.slug,
        metaTitle: page.seo?.metaTitle || '',
        metaDescription: page.seo?.metaDescription || '',
        urlSlug: page.seo?.urlSlug || page.slug,
        canonical: page.seo?.canonical || '',
        ogImage: page.seo?.ogImage || '',
        robots: page.seo?.robots || 'index, follow',
        llmTxt: page.seo?.llmTxt || '',
        schemaMarkup: pageSchema?.content || '',
        redirectPath: pageRedirect?.toPath || '',
        inSitemap: page.status === 'published',
      };
    });

    return NextResponse.json({ seo: seoList });
  } catch (error) {
    console.error('Get SEO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}