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
    const { websiteId, media } = body;

    if (!websiteId || !media) {
      return NextResponse.json({ success: false, error: 'Missing websiteId or media payload' }, { status: 400 });
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

    const mediaList = Array.isArray(media) ? media : [media];

    const mediaRecords = await Promise.all(
      mediaList.map(async (m) => {
        const { filename, url, mimeType, size, altText } = m;
        
        if (!filename || !url) {
          throw new Error('Media filename and url are required');
        }

        return prisma.websiteMedia.create({
          data: {
            websiteId,
            filename,
            url,
            mimeType: mimeType || 'image/jpeg',
            size: size || 0,
            altText: altText || null
          }
        });
      })
    );

    await prisma.syncLog.create({
      data: {
        websiteId,
        action: 'SYNC_MEDIA',
        status: 'success',
        details: `Synchronized ${mediaRecords.length} media assets.`
      }
    });

    return NextResponse.json({
      success: true,
      count: mediaRecords.length,
      media: mediaRecords,
      message: 'Media assets synchronized successfully.'
    });

  } catch (error) {
    console.error('[API Media Sync] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
