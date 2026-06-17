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
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Only expose published pages to frontend websites
    if (page.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Page not published' },
        { status: 404 }
      );
    }

    const globalSettings = await prisma.globalSettings.findUnique({
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
        isDynamic: page.isDynamic,
        lastSyncedAt: page.lastSyncedAt,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      },

      seo: {
        metaTitle: page.metaTitle,
        metaDesc: page.metaDesc,
        canonicalUrl: page.canonicalUrl,
        ogImage: page.ogImage,
      },

      contentBlocks: page.contentBlocks || [],

      jsonLdSchema: page.jsonLdSchema || null,

      globalSettings: globalSettings
        ? {
            siteName: globalSettings.siteName,
            favicon: globalSettings.favicon,
            primaryColor: globalSettings.primaryColor,

            headerConfig: globalSettings.headerConfig,

            footerConfig: globalSettings.footerConfig,

            gaTrackingId: globalSettings.gaTrackingId,

            clarityTrackingId: globalSettings.clarityTrackingId,

            customHeadScripts: globalSettings.customHeadScripts,
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