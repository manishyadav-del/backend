import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/pages/[id]/sections - Get all sections for a page
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const sections = await prisma.pageSection.findMany({
      where: {
        pageId: id,
        isDeleted: false
      },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Get sections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pages/[id]/sections - Add new section
export async function POST(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();
    const { type, title, content, settings, parentId, template, insertAfter } = body;

    if (!type) {
      return NextResponse.json({ error: 'Section type is required' }, { status: 400 });
    }

    // Get current max sort order
    const maxOrder = await prisma.pageSection.findFirst({
      where: {
        pageId: id,
        isDeleted: false,
        ...(parentId && { parentId })
      },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });

    let newSortOrder = (maxOrder?.sortOrder || 0) + 1;

    // If insertAfter is specified, shift orders
    if (insertAfter) {
      const afterSection = await prisma.pageSection.findUnique({
        where: { id: insertAfter }
      });

      if (afterSection && afterSection.pageId === id) {
        // Shift all sections after this one
        await prisma.pageSection.updateMany({
          where: {
            pageId: id,
            sortOrder: { gt: afterSection.sortOrder },
            isDeleted: false
          },
          data: { sortOrder: { increment: 1 } }
        });
        newSortOrder = afterSection.sortOrder + 1;
      }
    }

    const section = await prisma.pageSection.create({
      data: {
        pageId: id,
        type,
        title,
        content: content ? JSON.stringify(content) : '{}',
        settings: settings ? JSON.stringify(settings) : null,
        sortOrder: newSortOrder,
        parentId,
        template
      }
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('Create section error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}