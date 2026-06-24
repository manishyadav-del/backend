import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';
import { broadcastToWebsite } from '@/lib/socket.js';

// Supported modules and their human-readable labels
const MODULES = {
  cms: 'CMS',
  blog: 'Blog',
  seo: 'SEO',
  forms: 'Forms',
  legal: 'Legal',
  analytics: 'Analytics',
  media: 'Media',
  settings: 'Settings',
};

export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { module: assignedModule, config } = body;

    if (assignedModule && !MODULES[assignedModule]) {
      return NextResponse.json(
        { error: `Invalid module. Must be one of: ${Object.keys(MODULES).join(', ')}` },
        { status: 400 }
      );
    }

    const route = await prisma.websiteRoute.findUnique({ where: { id } });
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    const updated = await prisma.websiteRoute.update({
      where: { id },
      data: {
        assignedModule: assignedModule || null,
        moduleConfig: config ? JSON.stringify(config) : null,
        updatedAt: new Date()
      }
    });

    // Real-time broadcast to all SDK clients connected to this website
    broadcastToWebsite(route.websiteId, 'route:module-update', {
      routeId: id,
      path: route.path,
      module: assignedModule || null,
      config: config || null,
      timestamp: new Date().toISOString()
    });

    // SyncLog
    await prisma.syncLog.create({
      data: {
        websiteId: route.websiteId,
        action: 'ASSIGN_MODULE',
        status: 'success',
        details: `Assigned module "${assignedModule || 'none'}" to route ${route.path}`
      }
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: assignedModule
        ? `Module "${MODULES[assignedModule]}" assigned to ${route.path}`
        : `Module removed from ${route.path}`
    });
  } catch (error) {
    console.error('PUT /api/routes/[id]/module error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
