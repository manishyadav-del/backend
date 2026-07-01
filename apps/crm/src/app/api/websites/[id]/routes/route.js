import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { decryptText } from '@/lib/encryption.js';
import { broadcastToWebsite } from '@/lib/socket.js';

// Trigger sync payload to the external website API
async function pushSyncToWebsite(website, action, routeData) {
  try {
    if (!website.apiUrl) return { success: true, mocked: true };

    const decryptedToken = decryptText(website.authToken);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

    const res = await fetch(`${website.apiUrl}/sync-routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${decryptedToken}`
      },
      body: JSON.stringify({ action, route: routeData }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return { success: res.ok, status: res.status };
  } catch (error) {
    console.warn(`Sync failed to external target ${website.domain}:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const routes = await prisma.connectedRoute.findMany({
      where: { websiteId: id },
      orderBy: { path: 'asc' }
    });

    return NextResponse.json({ success: true, data: routes });
  } catch (error) {
    console.error('List routes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { path, title, content, metaTitle, metaDescription } = body;

    if (!path || !title) {
      return NextResponse.json({ error: 'Path and Title are required' }, { status: 400 });
    }

    const website = await prisma.connectedWebsite.findUnique({ where: { id } });
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Check duplicate path
    const existing = await prisma.connectedRoute.findUnique({
      where: {
        websiteId_path: {
          websiteId: id,
          path
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Route path already exists on this website' }, { status: 400 });
    }

    // Default structure for page sections
    const defaultContent = content || JSON.stringify({
      banner: { title, subtitle: `Dynamic ${title} section` },
      sections: [{ id: 'section-1', type: 'hero', title, text: `Dynamic content for ${path}` }]
    });

    const route = await prisma.connectedRoute.create({
      data: {
        websiteId: id,
        path,
        title,
        content: defaultContent,
        metaTitle,
        metaDescription,
        status: 'active'
      }
    });

    // Also write to new WebsiteRoute and WebsitePage tables
    await prisma.websiteRoute.create({
      data: {
        websiteId: id,
        path,
        title,
        status: 'active'
      }
    });

    const slug = path === '/' ? 'home' : path.replace(/^\//, '');
    await prisma.websitePage.create({
      data: {
        websiteId: id,
        slug,
        title,
        content: route.content,
        seoTitle: route.metaTitle,
        seoDesc: route.metaDescription,
        status: 'published'
      }
    });

    // Also add to new SyncLog table
    await prisma.syncLog.create({
      data: {
        websiteId: id,
        action: 'CREATE_ROUTE',
        status: 'success',
        details: `Route created: ${path} (${title})`
      }
    });

    // Trigger sync
    const syncRes = await pushSyncToWebsite(website, 'CREATE', route);
    const syncStatus = syncRes.success ? 'synced' : 'error';

    // Update website sync status
    await prisma.connectedWebsite.update({
      where: { id },
      data: { syncStatus, lastSyncedAt: new Date() }
    });

    await prisma.connectedWebsiteLog.create({
      data: {
        websiteId: id,
        action: 'ADD_ROUTE',
        status: syncRes.success ? 'success' : 'failure',
        details: syncRes.success 
          ? `Created route ${path} and successfully synchronized changes to frontend.`
          : `Created route ${path} locally, but synchronization failed: ${syncRes.error || 'Server error'}`
      }
    });

    // Real-time synchronization broadcast via WebSocket
    broadcastToWebsite(id, 'route:created', { route, synced: syncRes.success });

    return NextResponse.json({ success: true, data: route, synced: syncRes.success });
  } catch (error) {
    console.error('Create route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { routeId, path, title, content, metaTitle, metaDescription, status } = body;

    if (!routeId) {
      return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
    }

    const website = await prisma.connectedWebsite.findUnique({ where: { id } });
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const currentRoute = await prisma.connectedRoute.findUnique({ where: { id: routeId } });
    if (!currentRoute) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Check path unique duplicate if it's changing
    if (path && path !== currentRoute.path) {
      const duplicate = await prisma.connectedRoute.findUnique({
        where: {
          websiteId_path: {
            websiteId: id,
            path
          }
        }
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Target path already in use' }, { status: 400 });
      }
    }

    const updatedRoute = await prisma.connectedRoute.update({
      where: { id: routeId },
      data: {
        path: path || undefined,
        title: title || undefined,
        content: content || undefined,
        metaTitle: metaTitle !== undefined ? metaTitle : undefined,
        metaDescription: metaDescription !== undefined ? metaDescription : undefined,
        status: status || undefined
      }
    });

    // Mirror updates inside the new WebsiteRoute and WebsitePage tables
    try {
      await prisma.websiteRoute.update({
        where: {
          websiteId_path: {
            websiteId: id,
            path: currentRoute.path
          }
        },
        data: {
          path: path || undefined,
          title: title || undefined,
          status: status || undefined
        }
      });
      
      const currentSlug = currentRoute.path === '/' ? 'home' : currentRoute.path.replace(/^\//, '');
      const newSlug = path ? (path === '/' ? 'home' : path.replace(/^\//, '')) : undefined;
      
      await prisma.websitePage.update({
        where: {
          websiteId_slug: {
            websiteId: id,
            slug: currentSlug
          }
        },
        data: {
          slug: newSlug || undefined,
          title: title || undefined,
          content: content || undefined,
          seoTitle: metaTitle !== undefined ? metaTitle : undefined,
          seoDesc: metaDescription !== undefined ? metaDescription : undefined,
          status: status === 'active' ? 'published' : (status === 'inactive' ? 'draft' : undefined)
        }
      });

      await prisma.syncLog.create({
        data: {
          websiteId: id,
          action: 'UPDATE_ROUTE',
          status: 'success',
          details: `Route and Page synchronized to new tables: ${updatedRoute.path}`
        }
      });
    } catch (err) {
      console.warn('[SDK Sync Warning] Could not mirror update to new tables:', err.message);
    }

    // Trigger sync
    const syncRes = await pushSyncToWebsite(website, 'UPDATE', updatedRoute);
    const syncStatus = syncRes.success ? 'synced' : 'error';

    await prisma.connectedWebsite.update({
      where: { id },
      data: { syncStatus, lastSyncedAt: new Date() }
    });

    await prisma.connectedWebsiteLog.create({
      data: {
        websiteId: id,
        action: 'UPDATE_ROUTE',
        status: syncRes.success ? 'success' : 'failure',
        details: syncRes.success 
          ? `Updated route ${updatedRoute.path} and synchronized changes.`
          : `Updated route ${updatedRoute.path} locally; sync failed: ${syncRes.error || 'Server error'}`
      }
    });

    // Real-time synchronization broadcast via WebSocket
    broadcastToWebsite(id, 'route:updated', { route: updatedRoute, synced: syncRes.success });

    return NextResponse.json({ success: true, data: updatedRoute, synced: syncRes.success });
  } catch (error) {
    console.error('Update route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');

    if (!routeId) {
      return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
    }

    const website = await prisma.connectedWebsite.findUnique({ where: { id } });
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const route = await prisma.connectedRoute.findUnique({ where: { id: routeId } });
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    await prisma.connectedRoute.delete({ where: { id: routeId } });

    // Mirror delete inside new WebsiteRoute and WebsitePage tables
    try {
      await prisma.websiteRoute.delete({
        where: {
          websiteId_path: {
            websiteId: id,
            path: route.path
          }
        }
      });
      
      const slug = route.path === '/' ? 'home' : route.path.replace(/^\//, '');
      await prisma.websitePage.delete({
        where: {
          websiteId_slug: {
            websiteId: id,
            slug
          }
        }
      });

      await prisma.syncLog.create({
        data: {
          websiteId: id,
          action: 'DELETE_ROUTE',
          status: 'success',
          details: `Route and Page removed from new tables: ${route.path}`
        }
      });
    } catch (err) {
      console.warn('[SDK Sync Warning] Could not mirror delete to new tables:', err.message);
    }

    // Trigger sync delete
    const syncRes = await pushSyncToWebsite(website, 'DELETE', { path: route.path });
    const syncStatus = syncRes.success ? 'synced' : 'error';

    await prisma.connectedWebsite.update({
      where: { id },
      data: { syncStatus, lastSyncedAt: new Date() }
    });

    await prisma.connectedWebsiteLog.create({
      data: {
        websiteId: id,
        action: 'DELETE_ROUTE',
        status: syncRes.success ? 'success' : 'failure',
        details: syncRes.success 
          ? `Deleted route ${route.path} and synchronized change.`
          : `Deleted route ${route.path} locally; sync failed: ${syncRes.error || 'Server error'}`
      }
    });

    // Real-time synchronization broadcast via WebSocket
    broadcastToWebsite(id, 'route:deleted', { path: route.path, synced: syncRes.success });

    return NextResponse.json({ success: true, message: 'Route deleted successfully', synced: syncRes.success });
  } catch (error) {
    console.error('Delete route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
