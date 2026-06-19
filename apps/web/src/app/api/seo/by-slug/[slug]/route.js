import { NextResponse } from 'next/server';
import { validateApiKey, unauthorizedResponse } from '@/lib/apiKey.js';
import prisma from '@/lib/prisma.js';

export async function GET(request, { params }) {
  try {
    const project = await validateApiKey(request);
    if (!project) return unauthorizedResponse();

    const { slug } = params;
    const decodedSlug = decodeURIComponent(slug);

    const page = await prisma.page.findUnique({
      where: {
        projectId_slug: { projectId: project.id, slug: decodedSlug }
      },
      include: {
        seo: true
      }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      seo: page.seo ? {
        metaTitle: page.seo.metaTitle,
        metaDescription: page.seo.metaDescription,
        urlSlug: page.seo.urlSlug,
        canonical: page.seo.canonical,
        ogImage: page.seo.ogImage,
        robots: page.seo.robots,
        llmTxt: page.seo.llmTxt,
      } : null
    });
  } catch (error) {
    console.error('Get SEO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
