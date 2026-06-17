import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKey.js';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  try {
    // This route can be accessed by the dashboard (JWT) OR the SDK (API Key)
    let projectId = null;

    const projectViaKey = await validateApiKey(request);
    if (projectViaKey) {
      projectId = projectViaKey.id;
    } else {
      const user = getAuthUser(request);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      // If accessed via dashboard, we expect a projectId query param
      const url = new URL(request.url);
      projectId = url.searchParams.get('projectId');
      if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const pages = await prisma.page.findMany({
      where: { projectId },
      orderBy: { slug: 'asc' }
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('List pages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
