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
    const { websiteId, action, page } = body;

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

    if (action === 'sync_all') {
      // Return list of all active WebsitePages for this website
      const pages = await prisma.websitePage.findMany({
        where: { websiteId }
      });
      return NextResponse.json({ success: true, pages });
    }

    if (action === 'update' && page) {
      const { slug, title, content, seoTitle, seoDesc, ogImage, status } = page;
      
      if (!slug || !title) {
        return NextResponse.json({ success: false, error: 'Page slug and title are required for update' }, { status: 400 });
      }

      const stringifiedContent = typeof content === 'object' ? JSON.stringify(content) : content;

      const pageRecord = await prisma.websitePage.upsert({
        where: {
          websiteId_slug: { websiteId, slug }
        },
        update: {
          title,
          content: stringifiedContent,
          seoTitle,
          seoDesc,
          ogImage,
          status: status || 'published',
          updatedAt: new Date()
        },
        create: {
          websiteId,
          slug,
          title,
          content: stringifiedContent,
          seoTitle,
          seoDesc,
          ogImage,
          status: status || 'published'
        }
      });

      await prisma.syncLog.create({
        data: {
          websiteId,
          action: 'SYNC_PAGES',
          status: 'success',
          details: `Updated/Synchronized page '${slug}' (${title}).`
        }
      });

      return NextResponse.json({
        success: true,
        page: pageRecord,
        message: 'Page synchronized successfully.'
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid sync action or payload.' }, { status: 400 });

  } catch (error) {
    console.error('[API Pages Sync] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
