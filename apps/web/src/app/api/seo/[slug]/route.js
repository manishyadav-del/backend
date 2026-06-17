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
      select: {
        metaTitle: true,
        metaDesc: true,
        canonicalUrl: true,
        ogImage: true,
      }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ seo: page });
  } catch (error) {
    console.error('Get SEO error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
