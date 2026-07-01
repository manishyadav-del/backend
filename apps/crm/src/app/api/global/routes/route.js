import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import jwt from 'jsonwebtoken';

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

    // Verify website matches the token claim
    if (decoded.websiteId !== websiteId) {
      return NextResponse.json({ success: false, error: 'Forbidden: Website ID mismatch' }, { status: 403 });
    }

    const website = await prisma.website.findUnique({
      where: { id: websiteId }
    });

    if (!website) {
      return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
    }

    // Upsert routes
    const routeRecords = await Promise.all(
      routes.map(async (path) => {
        return prisma.websiteRoute.upsert({
          where: {
            websiteId_path: { websiteId, path }
          },
          update: {
            updatedAt: new Date()
          },
          create: {
            websiteId,
            path,
            title: `Discovered page at ${path}`,
            status: 'active'
          }
        });
      })
    );

    // Track in SyncLog
    await prisma.syncLog.create({
      data: {
        websiteId,
        action: 'SYNC_ROUTES',
        status: 'success',
        details: `Discovered and synchronized ${routes.length} paths successfully: ${routes.join(', ')}`
      }
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
