import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/pages/[id]/sections/[sectionId] - Get single section
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, sectionId } = await params;

    const section = await prisma.pageSection.findFirst({
      where: {
        id: sectionId,
        pageId: id,
        isDeleted: false
      }
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Get section error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/pages/[id]/sections/[sectionId] - Update section
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, sectionId } = await params;
    const body = await request.json();
    const { type, title, content, settings, isVisible, sortOrder, template } = body;

    const section = await prisma.pageSection.findFirst({
      where: {
        id: sectionId,
        pageId: id,
        isDeleted: false
      }
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const updatedSection = await prisma.pageSection.update({
      where: { id: sectionId },
      data: {
        ...(type && { type }),
        ...(title !== undefined && { title }),
        ...(content && { content: JSON.stringify(content) }),
        ...(settings !== undefined && { settings: settings ? JSON.stringify(settings) : null }),
        ...(isVisible !== undefined && { isVisible }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(template !== undefined && { template })
      }
    });

    return NextResponse.json({ section: updatedSection });
  } catch (error) {
    console.error('Update section error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/pages/[id]/sections/[sectionId] - Soft delete section
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, sectionId } = await params;

    const section = await prisma.pageSection.findFirst({
      where: {
        id: sectionId,
        pageId: id,
        isDeleted: false
      }
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.pageSection.update({
      where: { id: sectionId },
      data: { isDeleted: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete section error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/pages/[id]/sections/[sectionId] - Reorder sections
export async function PATCH(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { sectionId, newSortOrder, direction } = body;

    if (!sectionId || newSortOrder === undefined) {
      return NextResponse.json({ error: 'sectionId and newSortOrder are required' }, { status: 400 });
    }

    const section = await prisma.pageSection.findFirst({
      where: {
        id: sectionId,
        pageId: id,
        isDeleted: false
      }
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const oldSortOrder = section.sortOrder;

    if (oldSortOrder === newSortOrder) {
      return NextResponse.json({ section });
    }

    if (direction === 'up' || newSortOrder < oldSortOrder) {
      // Move up: shift sections between new and old order down
      await prisma.pageSection.updateMany({
        where: {
          pageId: id,
          sortOrder: { gte: newSortOrder, lt: oldSortOrder },
          isDeleted: false
        },
        data: { sortOrder: { increment: 1 } }
      });
    } else {
      // Move down: shift sections between old and new order up
      await prisma.pageSection.updateMany({
        where: {
          pageId: id,
          sortOrder: { gt: oldSortOrder, lte: newSortOrder },
          isDeleted: false
        },
        data: { sortOrder: { decrement: 1 } }
      });
    }

    // Update the moved section
    const updatedSection = await prisma.pageSection.update({
      where: { id: sectionId },
      data: { sortOrder: newSortOrder }
    });

    return NextResponse.json({ section: updatedSection });
  } catch (error) {
    console.error('Reorder section error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
