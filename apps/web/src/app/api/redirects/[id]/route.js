import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/redirects/[id] - Get single redirect
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const redirect = await prisma.redirect.findUnique({
      where: { id },
    });

    if (!redirect) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    return NextResponse.json({ redirect });
  } catch (error) {
    console.error('Get redirect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/redirects/[id] - Update redirect
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();
    const { fromPath, toPath, type, isActive } = body;

    const redirect = await prisma.redirect.findUnique({
      where: { id },
    });

    if (!redirect) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    const updatedRedirect = await prisma.redirect.update({
      where: { id },
      data: {
        ...(fromPath && { fromPath }),
        ...(toPath && { toPath }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ redirect: updatedRedirect });
  } catch (error) {
    console.error('Update redirect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/redirects/[id] - Delete redirect
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    await prisma.redirect.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete redirect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}