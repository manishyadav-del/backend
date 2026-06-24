import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';
import { broadcastToWebsite } from '@/lib/socket.js';

export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if the id is a Website ID first
    const website = await prisma.website.findUnique({
      where: { id }
    });

    if (website) {
      const routes = await prisma.websiteRoute.findMany({
        where: { websiteId: id },
        orderBy: { path: 'asc' }
      });
      return NextResponse.json({ success: true, data: routes });
    }

    // Otherwise, check if it's a specific route ID
    const route = await prisma.websiteRoute.findUnique({
      where: { id }
    });

    if (route) {
      return NextResponse.json({ success: true, data: route });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('GET route error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, path, metaTitle, metaDescription, keywords, ogImage, canonical, visibility, status, assignedModule, moduleConfig } = body;

    // Find route by ID
    let route = await prisma.websiteRoute.findUnique({ where: { id } });
    
    // If not found by ID, try searching ConnectedRoute
    let connectedRoute = await prisma.connectedRoute.findUnique({ where: { id } });

    if (!route && !connectedRoute) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    const targetRouteId = route ? route.id : connectedRoute.id;
    const websiteId = route ? route.websiteId : connectedRoute.websiteId;
    const currentPath = route ? route.path : connectedRoute.path;

    // Update WebsiteRoute
    if (route) {
      route = await prisma.websiteRoute.update({
        where: { id: targetRouteId },
        data: {
          title: title || undefined,
          path: path || undefined,
          status: status || undefined,
          assignedModule: assignedModule !== undefined ? (assignedModule || null) : undefined,
          moduleConfig: moduleConfig !== undefined ? (moduleConfig ? JSON.stringify(moduleConfig) : null) : undefined,
          updatedAt: new Date()
        }
      });
    }

    // Update ConnectedRoute
    if (connectedRoute) {
      connectedRoute = await prisma.connectedRoute.update({
        where: { id: connectedRoute.id },
        data: {
          title: title || undefined,
          path: path || undefined,
          metaTitle: metaTitle !== undefined ? metaTitle : undefined,
          metaDescription: metaDescription !== undefined ? metaDescription : undefined,
          status: status || undefined,
          updatedAt: new Date()
        }
      });
    }

    // Update or create WebsitePage for SEO metadata and block content
    const slug = currentPath === '/' ? 'home' : currentPath.replace(/^\//, '');
    const stringifiedContent = body.content ? (typeof body.content === 'object' ? JSON.stringify(body.content) : body.content) : undefined;
    
    await prisma.websitePage.upsert({
      where: {
        websiteId_slug: { websiteId, slug }
      },
      update: {
        title: title || undefined,
        content: stringifiedContent || undefined,
        seoTitle: metaTitle !== undefined ? metaTitle : undefined,
        seoDesc: metaDescription !== undefined ? metaDescription : undefined,
        ogImage: ogImage || undefined,
        status: status === 'active' ? 'published' : 'draft',
        updatedAt: new Date()
      },
      create: {
        websiteId,
        slug,
        title: title || 'Page',
        content: stringifiedContent || '{}',
        seoTitle: metaTitle || '',
        seoDesc: metaDescription || '',
        status: 'published'
      }
    });

    // Real-time synchronization broadcast via WebSocket
    broadcastToWebsite(websiteId, 'route:update', {
      id: targetRouteId,
      path: path || currentPath,
      title,
      metaTitle,
      metaDescription,
      keywords,
      canonical,
      visibility,
      status
    });

    // SyncLog
    await prisma.syncLog.create({
      data: {
        websiteId,
        action: 'UPDATE_ROUTE',
        status: 'success',
        details: `Updated route metadata: ${path || currentPath}`
      }
    });

    return NextResponse.json({ success: true, data: route || connectedRoute });
  } catch (error) {
    console.error('PUT route error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
