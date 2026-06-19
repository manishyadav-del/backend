import { NextResponse } from 'next/server';
import { validateApiKey, unauthorizedResponse } from '@/lib/apiKey.js';
import prisma from '@/lib/prisma.js';

export async function GET(request, { params }) {
  try {
    const project = await validateApiKey(request);

    if (!project) {
      return unauthorizedResponse();
    }

    const { slug } = params;
    const decodedSlug = decodeURIComponent(slug);

    const page = await prisma.page.findUnique({
      where: {
        projectId_slug: {
          projectId: project.id,
          slug: decodedSlug,
        },
      },
      include: {
        seo: true,
        schema: true,
        sections_rel: {
          where: { isDeleted: false, isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Only expose published pages to frontend websites (case-insensitive check)
    if (page.status.toUpperCase() !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Page not published' },
        { status: 404 }
      );
    }

    const globalSettings = await prisma.globalSetting.findUnique({
      where: {
        projectId: project.id,
      },
    });

    return NextResponse.json({
      page: {
        id: page.id,
        slug: page.slug,
        title: page.title,
        status: page.status,
        isDynamic: page.slug.includes('[') && page.slug.includes(']'),
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      },

      seo: page.seo ? {
        metaTitle: page.seo.metaTitle,
        metaDesc: page.seo.metaDescription,
        canonicalUrl: page.seo.canonical,
        ogImage: page.seo.ogImage,
        robots: page.seo.robots,
        llmTxt: page.seo.llmTxt,
      } : null,

      contentBlocks: page.sections_rel || [],

      jsonLdSchema: page.schema ? page.schema.map(s => {
        try {
          return typeof s.content === 'string' ? JSON.parse(s.content) : s.content;
        } catch {
          return s.content;
        }
      }) : [],

      globalSettings: globalSettings
        ? {
            siteName: project.name,
            favicon: globalSettings.favicon,
            primaryColor: globalSettings.brandColor,
            headerConfig: globalSettings.headerSettings ? JSON.parse(globalSettings.headerSettings) : null,
            footerConfig: globalSettings.footerSettings ? JSON.parse(globalSettings.footerSettings) : null,
            gaTrackingId: globalSettings.analytics ? JSON.parse(globalSettings.analytics).gaId : null,
            clarityTrackingId: globalSettings.analytics ? JSON.parse(globalSettings.analytics).clarityId : null,
          }
        : null,
    });
  } catch (error) {
    console.error('Get page by slug error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}