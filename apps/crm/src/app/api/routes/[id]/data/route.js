import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';

/**
 * GET /api/routes/:id/data
 * SDK-callable endpoint (API Key auth). Returns the assigned module's data for a given route.
 * Supports ?path=/blog as alternative to route ID lookup.
 */
export async function GET(request, { params }) {
  try {
    // API Key auth (for SDK calls from frontend)
    const apiKey = request.headers.get('x-api-key') || new URL(request.url).searchParams.get('apiKey');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const pathQuery = searchParams.get('path');

    // Find the website by API key
    const website = await prisma.website.findFirst({
      where: { apiKey }
    });

    if (!website) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Find the route — by ID, or by path+websiteId
    let route;
    if (pathQuery) {
      route = await prisma.websiteRoute.findFirst({
        where: { websiteId: website.id, path: pathQuery }
      });
    } else {
      route = await prisma.websiteRoute.findFirst({
        where: { id, websiteId: website.id }
      });
    }

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    if (!route.assignedModule) {
      return NextResponse.json({
        success: true,
        route: { id: route.id, path: route.path },
        module: null,
        data: null
      });
    }

    // Resolve module data based on assigned module
    const moduleData = await resolveModuleData(route.assignedModule, website.id, route.moduleConfig);

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        path: route.path,
        title: route.title,
        routeType: route.routeType
      },
      module: route.assignedModule,
      config: route.moduleConfig ? JSON.parse(route.moduleConfig) : null,
      data: moduleData
    });
  } catch (error) {
    console.error('GET /api/routes/[id]/data error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

/**
 * Resolves the actual data for a given module type.
 * Each module returns its standard content from the database.
 */
async function resolveModuleData(module, websiteId, moduleConfigJson) {
  try {
    // Find associated project via website apiKey
    const website = await prisma.website.findUnique({ where: { id: websiteId } });
    const domain = website?.domain;

    // Try to find a Project matching this website's domain/apiKey
    const project = await prisma.project.findFirst({
      where: { domain: domain || undefined }
    });

    const projectId = project?.id;

    switch (module) {
      case 'blog': {
        if (!projectId) return { posts: [] };
        const posts = await prisma.blog.findMany({
          where: { projectId, status: 'published' },
          select: {
            id: true, title: true, slug: true, excerpt: true,
            featuredImage: true, author: true, publishedAt: true,
            category: true, tags: true
          },
          orderBy: { publishedAt: 'desc' },
          take: 20
        });
        return { posts };
      }

      case 'cms': {
        if (!projectId) return { pages: [] };
        const pages = await prisma.page.findMany({
          where: { projectId, status: 'published' },
          select: { id: true, title: true, slug: true, path: true, banner: true, template: true },
          orderBy: { sortOrder: 'asc' }
        });
        return { pages };
      }

      case 'seo': {
        if (!projectId) return { seo: null };
        const settings = await prisma.globalSetting.findUnique({
          where: { projectId }
        });
        return { seo: settings ? JSON.parse(settings.seo || '{}') : null };
      }

      case 'forms': {
        if (!projectId) return { forms: [] };
        const forms = await prisma.formSubmission.findMany({
          where: { projectId },
          select: { id: true, formId: true, data: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
        return { forms };
      }

      case 'legal': {
        if (!projectId) return { pages: [] };
        const legalPages = await prisma.legalPage.findMany({
          where: { projectId },
          select: { id: true, title: true, slug: true, content: true, updatedAt: true },
          orderBy: { sortOrder: 'asc' }
        });
        return { pages: legalPages };
      }

      case 'analytics': {
        if (!projectId) return { analytics: null };
        const settings = await prisma.globalSetting.findUnique({
          where: { projectId }
        });
        return { analytics: settings ? JSON.parse(settings.analytics || '{}') : null };
      }

      case 'media': {
        if (!projectId) return { media: [] };
        const media = await prisma.media.findMany({
          where: { projectId },
          select: { id: true, title: true, url: true, type: true, alt: true, size: true },
          orderBy: { createdAt: 'desc' },
          take: 50
        });
        return { media };
      }

      case 'settings': {
        if (!projectId) return { settings: null };
        const settings = await prisma.globalSetting.findUnique({
          where: { projectId }
        });
        return {
          settings: settings ? {
            id: settings.id,
            brandColor: project?.brandColor,
            logo: project?.logo,
            favicon: project?.favicon,
          } : null
        };
      }

      default:
        return null;
    }
  } catch (err) {
    console.error('[resolveModuleData] Error:', err.message);
    return null;
  }
}
