import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const apiKey = request.headers.get('x-api-key') || new URL(request.url).searchParams.get('apiKey');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const route = searchParams.get('route') || '/';

    const website = await prisma.website.findFirst({
      where: { apiKey }
    });

    if (!website) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const component = await prisma.websiteComponent.findFirst({
      where: {
        websiteId: website.id,
        name,
        route
      }
    });

    if (!component) {
      return NextResponse.json({
        success: true,
        component: name,
        route,
        data: null
      });
    }

    let parsedData = {};
    try {
      parsedData = component.data ? JSON.parse(component.data) : {};
    } catch (e) {
      parsedData = {};
    }

    return NextResponse.json({
      success: true,
      id: component.id,
      component: component.name,
      route: component.route,
      data: parsedData,
      status: component.status
    });
  } catch (error) {
    console.error('GET /api/components/data error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
