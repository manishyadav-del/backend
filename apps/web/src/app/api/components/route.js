import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');
    const route = searchParams.get('route');

    const where = {};
    if (websiteId) where.websiteId = websiteId;
    if (route) where.route = route;

    const components = await prisma.websiteComponent.findMany({
      where,
      include: {
        website: {
          select: { id: true, name: true, domain: true }
        }
      },
      orderBy: [{ websiteId: 'asc' }, { route: 'asc' }, { sortOrder: 'asc' }]
    });

    return NextResponse.json({ success: true, data: components });
  } catch (error) {
    console.error('GET /api/components error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
