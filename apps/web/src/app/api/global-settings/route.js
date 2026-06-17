import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKey.js';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  try {
    let projectId = null;

    const projectViaKey = await validateApiKey(request);
    if (projectViaKey) {
      projectId = projectViaKey.id;
    } else {
      const user = getAuthUser(request);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      const url = new URL(request.url);
      projectId = url.searchParams.get('projectId');
      if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const settings = await prisma.globalSettings.findUnique({
      where: { projectId }
    });

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get global settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

    const body = await request.json();
    const { headerConfig, footerConfig, gaTrackingId, clarityTrackingId, customHeadScripts, siteName, favicon, primaryColor } = body;

    const settings = await prisma.globalSettings.upsert({
      where: { projectId },
      update: {
        ...(headerConfig !== undefined && { headerConfig }),
        ...(footerConfig !== undefined && { footerConfig }),
        ...(gaTrackingId !== undefined && { gaTrackingId }),
        ...(clarityTrackingId !== undefined && { clarityTrackingId }),
        ...(customHeadScripts !== undefined && { customHeadScripts }),
        ...(siteName !== undefined && { siteName }),
        ...(favicon !== undefined && { favicon }),
        ...(primaryColor !== undefined && { primaryColor }),
      },
      create: {
        projectId,
        headerConfig: headerConfig || {},
        footerConfig: footerConfig || {},
        gaTrackingId,
        clarityTrackingId,
        customHeadScripts,
        siteName,
        favicon,
        primaryColor,
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update global settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
