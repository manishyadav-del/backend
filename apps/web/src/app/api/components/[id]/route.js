import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';
import { broadcastToWebsite } from '@/lib/socket.js';

export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const component = await prisma.websiteComponent.findUnique({
      where: { id }
    });

    if (!component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: component });
  } catch (error) {
    console.error('GET /api/components/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { data: configData, status, sortOrder } = body;

    const component = await prisma.websiteComponent.findUnique({
      where: { id }
    });

    if (!component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    const stringifiedData = typeof configData === 'object' ? JSON.stringify(configData) : configData;

    const updated = await prisma.websiteComponent.update({
      where: { id },
      data: {
        data: stringifiedData || undefined,
        status: status || undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        updatedAt: new Date()
      }
    });

    // Parse the saved data before broadcast
    let parsedData = configData;
    if (typeof configData === 'string') {
      try { parsedData = JSON.parse(configData); } catch (e) {}
    }

    // WebSocket update event payload
    const eventPayload = {
      id,
      name: component.name,
      route: component.route,
      data: parsedData,
      status: status || component.status
    };

    // Emit event: component:update to website room
    broadcastToWebsite(component.websiteId, 'component:update', eventPayload);

    // SyncLog
    await prisma.syncLog.create({
      data: {
        websiteId: component.websiteId,
        action: 'UPDATE_COMPONENT',
        status: 'success',
        details: `Configured content values for component: ${component.name}`
      }
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Component "${component.name}" content saved and synchronized.`
    });
  } catch (error) {
    console.error('PUT /api/components/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
