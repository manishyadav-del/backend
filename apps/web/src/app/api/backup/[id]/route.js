import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/backup/[id] - Get single backup
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    return NextResponse.json({ backup });
  } catch (error) {
    console.error('Get backup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/backup/[id] - Update backup
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();
    const { type, fileUrl, size, status } = body;

    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    const updatedBackup = await prisma.backup.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(size !== undefined && { size }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ backup: updatedBackup });
  } catch (error) {
    console.error('Update backup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/backup/[id] - Delete backup
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    await prisma.backup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete backup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}