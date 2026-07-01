import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || 'demo';

  try {
    const ads = await prisma.advert.findMany({
      where: { projectId },
      include: {
        analytics: {
          select: { type: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, ads });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action } = body;

    // Create custom banner or adsense slot
    if (action === 'create') {
      const { projectId = 'demo', name, type, slotId, imageUrl, targetUrl } = body;

      if (!name || !type) {
        return NextResponse.json({ success: false, error: 'Name and Type are required' }, { status: 400 });
      }

      const ad = await prisma.advert.create({
        data: {
          projectId,
          name,
          type,
          slotId,
          imageUrl,
          targetUrl
        }
      });

      return NextResponse.json({ success: true, ad });
    }

    // Log impression or click analytics
    if (action === 'track') {
      const { advertId, type, visitorId } = body;

      if (!advertId || !type) {
        return NextResponse.json({ success: false, error: 'Advert ID and Tracking Type are required' }, { status: 400 });
      }

      const log = await prisma.advertAnalytic.create({
        data: {
          advertId,
          type,
          visitorId
        }
      });

      return NextResponse.json({ success: true, log });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
