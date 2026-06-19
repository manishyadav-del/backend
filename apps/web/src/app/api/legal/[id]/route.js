import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/legal/[id] - Get single legal page
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const legalPage = await prisma.legalPage.findUnique({
      where: { id },
    });

    if (!legalPage) {
      return NextResponse.json({ error: 'Legal page not found' }, { status: 404 });
    }

    return NextResponse.json({ legalPage });
  } catch (error) {
    console.error('Get legal page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/legal/[id] - Update legal page
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();
    const { type, title, content } = body;

    const legalPage = await prisma.legalPage.findUnique({
      where: { id },
    });

    if (!legalPage) {
      return NextResponse.json({ error: 'Legal page not found' }, { status: 404 });
    }

    const updatedLegalPage = await prisma.legalPage.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(content && { lastUpdated: new Date() }),
      },
    });

    return NextResponse.json({ legalPage: updatedLegalPage });
  } catch (error) {
    console.error('Update legal page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/legal/[id] - Delete legal page
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    await prisma.legalPage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete legal page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}