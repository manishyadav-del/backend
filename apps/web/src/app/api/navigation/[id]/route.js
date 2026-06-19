import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/navigation/[id] - Get single navigation
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const navigation = await prisma.navigation.findUnique({
      where: { id },
    });

    if (!navigation) {
      return NextResponse.json({ error: 'Navigation not found' }, { status: 404 });
    }

    return NextResponse.json({ navigation });
  } catch (error) {
    console.error('Get navigation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/navigation/[id] - Update navigation
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();
    const { location, items } = body;

    const navigation = await prisma.navigation.findUnique({
      where: { id },
    });

    if (!navigation) {
      return NextResponse.json({ error: 'Navigation not found' }, { status: 404 });
    }

    const updatedNavigation = await prisma.navigation.update({
      where: { id },
      data: {
        ...(location && { location }),
        ...(items && { items }),
      },
    });

    return NextResponse.json({ navigation: updatedNavigation });
  } catch (error) {
    console.error('Update navigation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/navigation/[id] - Delete navigation
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    await prisma.navigation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete navigation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}