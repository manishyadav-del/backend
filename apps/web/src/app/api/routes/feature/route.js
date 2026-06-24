import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';

/**
 * GET /api/routes/feature?path=/blog
 * SDK-callable endpoint using API Key auth.
 * Returns the assigned module and its data for a given route path.
 */
export async function GET(request) {
  try {
    const apiKey = request.headers.get('x-api-key') || new URL(request.url).searchParams.get('apiKey');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'path query parameter is required' }, { status: 400 });
    }

    // Resolve website by API key
    const website = await prisma.website.findFirst({ where: { apiKey } });
    if (!website) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Find route by path
    const route = await prisma.websiteRoute.findFirst({
      where: { websiteId: website.id, path }
    });

    if (!route) {
      return NextResponse.json({
        success: true,
        route: null,
        module: null,
        config: null,
        data: null
      });
    }

    if (!route.assignedModule) {
      return NextResponse.json({
        success: true,
        route: { id: route.id, path: route.path, title: route.title, routeType: route.routeType },
        module: null,
        config: null,
        data: null
      });
    }

    const moduleData = await resolveModuleData(route.assignedModule, website);

    return NextResponse.json({
      success: true,
      route: { id: route.id, path: route.path, title: route.title, routeType: route.routeType },
      module: route.assignedModule,
      config: route.moduleConfig ? safeParseJSON(route.moduleConfig) : null,
      data: moduleData
    });
  } catch (error) {
    console.error('GET /api/routes/feature error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

function safeParseJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}

async function resolveModuleData(module, website) {
  try {
    const project = await prisma.project.findFirst({
      where: { domain: website.domain || undefined }
    });
    const projectId = project?.id;

    switch (module) {
      case 'blog': {
        if (!projectId) return { posts: [] };
        const posts = await prisma.blog.findMany({
          where: { projectId, status: 'published' },
          select: { id: true, title: true, slug: true, excerpt: true, featuredImage: true, author: true, publishedAt: true, category: true, tags: true },
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
        const settings = await prisma.globalSetting.findUnique({ where: { projectId } });
        return { seo: settings ? safeParseJSON(settings.seo || '{}') : null };
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
        const settings = await prisma.globalSetting.findUnique({ where: { projectId } });
        return { analytics: settings ? safeParseJSON(settings.analytics || '{}') : null };
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
        return { settings: { logo: project?.logo, favicon: project?.favicon, brandColor: project?.brandColor } };
      }
      default:
        return null;
    }
  } catch (err) {
    console.error('[resolveModuleData]', err.message);
    return null;
  }
}
