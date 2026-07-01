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
    const { websiteId, action, header, footer } = body;

    if (!websiteId) {
      return NextResponse.json({ success: false, error: 'Missing websiteId' }, { status: 400 });
    }

    if (decoded.websiteId !== websiteId) {
      return NextResponse.json({ success: false, error: 'Forbidden: Website ID mismatch' }, { status: 403 });
    }

    const website = await prisma.website.findUnique({
      where: { id: websiteId }
    });

    if (!website) {
      return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
    }

    // 1. Sync header layout
    if (action === 'header' && header) {
      const job = await prisma.syncJob.create({
        data: {
          websiteId,
          type: 'header',
          status: 'completed',
          payload: JSON.stringify(header)
        }
      });

      await prisma.syncLog.create({
        data: {
          websiteId,
          action: 'SYNC_HEADER',
          status: 'success',
          details: `Header sync completed: Logo: ${header.logo || 'none'}, Menus: ${JSON.stringify(header.navigation || [])}`
        }
      });

      return NextResponse.json({
        success: true,
        job,
        message: 'Header layout sync completed successfully.'
      });
    }

    // 2. Sync footer layout
    if (action === 'footer' && footer) {
      const job = await prisma.syncJob.create({
        data: {
          websiteId,
          type: 'footer',
          status: 'completed',
          payload: JSON.stringify(footer)
        }
      });

      await prisma.syncLog.create({
        data: {
          websiteId,
          action: 'SYNC_FOOTER',
          status: 'success',
          details: `Footer sync completed: Copyright: ${footer.copyright || 'none'}`
        }
      });

      return NextResponse.json({
        success: true,
        job,
        message: 'Footer layout sync completed successfully.'
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid sync payload or unrecognized action.' }, { status: 400 });

  } catch (error) {
    console.error('[API Global Sync] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
