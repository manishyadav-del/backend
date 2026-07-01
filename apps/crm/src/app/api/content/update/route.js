import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';
import { broadcastToWebsite } from '@/lib/socket.js';

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { websiteId, slug, path, content, type } = body;

    if (!websiteId || (!slug && !path)) {
      return NextResponse.json({ error: 'websiteId and slug (or path) are required' }, { status: 400 });
    }

    const targetSlug = slug || (path === '/' ? 'home' : path.replace(/^\//, ''));
    const targetPath = path || (slug === 'home' ? '/' : `/${slug}`);

    const stringifiedContent = typeof content === 'object' ? JSON.stringify(content) : content;

    // 1. Update WebsitePage content
    const page = await prisma.websitePage.upsert({
      where: {
        websiteId_slug: { websiteId, slug: targetSlug }
      },
      update: {
        content: stringifiedContent,
        updatedAt: new Date()
      },
      create: {
        websiteId,
        slug: targetSlug,
        title: targetSlug.charAt(0).toUpperCase() + targetSlug.slice(1),
        content: stringifiedContent,
        status: 'published'
      }
    });

    // 2. Mirror update to ConnectedRoute content
    await prisma.connectedRoute.updateMany({
      where: {
        websiteId,
        path: targetPath
      },
      data: {
        content: stringifiedContent,
        updatedAt: new Date()
      }
    });

    // 3. Real-time synchronization broadcast via WebSocket
    broadcastToWebsite(websiteId, 'content:update', {
      slug: targetSlug,
      path: targetPath,
      content,
      type: type || 'page'
    });

    // Track log
    await prisma.syncLog.create({
      data: {
        websiteId,
        action: 'UPDATE_CONTENT',
        status: 'success',
        details: `Updated dynamic content block: ${targetPath}`
      }
    });

    return NextResponse.json({ success: true, data: page, message: 'Content updated and synchronized successfully.' });
  } catch (error) {
    console.error('Update content error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
