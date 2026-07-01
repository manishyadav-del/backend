import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/redirects - List all redirects for a project
export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

    const redirects = await prisma.redirect.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ redirects });
  } catch (error) {
    console.error('Get redirects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/redirects - Create a new redirect
export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { projectId, fromPath, toPath, type, isActive } = body;

    if (!projectId || !fromPath || !toPath) {
      return NextResponse.json({ error: 'Project ID, from path, and to path are required' }, { status: 400 });
    }

    const redirect = await prisma.redirect.create({
      data: {
        projectId,
        fromPath,
        toPath,
        type: type || '301',
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ redirect }, { status: 201 });
  } catch (error) {
    console.error('Create redirect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}