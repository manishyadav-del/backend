import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import jwt from 'jsonwebtoken';
import { broadcastToWebsite } from '@/lib/socket.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing Authorization Header' }, { status: 401 });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Token' }, { status: 401 });
    }

    const body = await request.json();
    const { websiteId, routes } = body;

    if (!websiteId || !Array.isArray(routes)) {
      return NextResponse.json({ success: false, error: 'Invalid payload: websiteId and routes list are required' }, { status: 400 });
    }

    if (decoded.websiteId !== websiteId) {
      return NextResponse.json({ success: false, error: 'Forbidden: Website ID mismatch' }, { status: 403 });
    }

    const website = await prisma.website.findUnique({ where: { id: websiteId } });
    if (!website) {
      return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
    }

    // Upsert routes with enriched metadata
    const routeRecords = await Promise.all(
      routes.map(async (routeObj) => {
        const routePath = typeof routeObj === 'string' ? routeObj : (routeObj.path || routeObj.slug);
        
        let isDynamic = false;
        let routeType = 'page';
        
        if (typeof routeObj === 'string') {
          isDynamic = /\[.+\]/.test(routePath);
          routeType = routePath.startsWith('/api') ? 'api' : (isDynamic ? 'dynamic' : 'page');
        } else {
          isDynamic = routeObj.isDynamic || /\[.+\]/.test(routePath) || false;
          routeType = routeObj.type || (routePath.startsWith('/api') ? 'api' : (isDynamic ? 'dynamic' : 'page'));
        }

        const routeTitle = typeof routeObj === 'string'
          ? `${routeType.charAt(0).toUpperCase() + routeType.slice(1)}: ${routePath}`
          : (routeObj.title || `${routeType.charAt(0).toUpperCase() + routeType.slice(1)}: ${routePath}`);

        // Check if route exists to preserve manual module assignment
        const existingRoute = await prisma.websiteRoute.findUnique({
          where: { websiteId_path: { websiteId, path: routePath } }
        });

        let assignedModule = existingRoute?.assignedModule || null;
        if (!assignedModule) {
          const normalizedPath = routePath.toLowerCase();
          if (normalizedPath === '/blog' || normalizedPath.startsWith('/blog/')) {
            assignedModule = 'blog';
          } else if (normalizedPath === '/contact' || normalizedPath === '/newsletter' || normalizedPath === '/subscribe') {
            assignedModule = 'forms';
          } else if (normalizedPath === '/privacy-policy' || normalizedPath === '/privacy' || normalizedPath === '/terms' || normalizedPath === '/terms-and-conditions' || normalizedPath === '/cookies' || normalizedPath === '/cookie-policy') {
            assignedModule = 'legal';
          } else if (normalizedPath === '/about' || normalizedPath === '/services' || normalizedPath === '/' || normalizedPath === '/home') {
            assignedModule = 'cms';
          } else if (normalizedPath === '/dashboard' || normalizedPath === '/profile' || normalizedPath === '/admin' || normalizedPath === '/settings') {
            assignedModule = 'settings';
          } else if (normalizedPath === '/reviews' || normalizedPath === '/testimonials') {
            assignedModule = 'cms';
          }
        }

        // Upsert WebsiteRoute
        const wr = await prisma.websiteRoute.upsert({
          where: { websiteId_path: { websiteId, path: routePath } },
          update: { title: routeTitle, routeType, isDynamic, assignedModule, updatedAt: new Date() },
          create: { websiteId, path: routePath, title: routeTitle, routeType, isDynamic, assignedModule, status: 'active' }
        });

        // Upsert ConnectedRoute
        await prisma.connectedRoute.upsert({
          where: { websiteId_path: { websiteId, path: routePath } },
          update: { title: routeTitle, updatedAt: new Date() },
          create: { websiteId, path: routePath, title: routeTitle, status: 'active' }
        });

        return wr;
      })
    );

    // Update lastSyncedAt on both tables
    await Promise.all([
      prisma.website.update({ where: { id: websiteId }, data: { lastSyncedAt: new Date() } }),
      prisma.connectedWebsite.updateMany({ where: { id: websiteId }, data: { lastSyncedAt: new Date() } })
    ]);

    // Track in SyncLog
    await prisma.syncLog.create({
      data: {
        websiteId,
        action: 'SYNC_ROUTES',
        status: 'success',
        details: `Discovered and synchronized ${routes.length} paths successfully.`
      }
    });

    // Real-time broadcast to dashboard
    broadcastToWebsite(websiteId, 'website:sync', {
      type: 'route:sync',
      websiteId,
      routeCount: routeRecords.length,
      message: `${routeRecords.length} routes synchronized`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      count: routeRecords.length,
      message: 'Routes synchronized successfully.'
    });

  } catch (error) {
    console.error('[API Routes Sync] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
