import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    
    // Find backup details
    const backup = await prisma.backup.findUnique({
      where: { id }
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    // Resolve file path on disk
    // backup.fileUrl is like "/backups/{projectId}/{filename}"
    const relativePath = backup.fileUrl;
    const absolutePath = path.join(process.cwd(), 'public', relativePath);

    try {
      const data = await fs.readFile(absolutePath);
      const filename = path.basename(absolutePath);

      return new Response(data, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        }
      });
    } catch (err) {
      console.error('File read error:', err);
      return NextResponse.json({ error: 'Backup file missing on disk' }, { status: 404 });
    }
  } catch (error) {
    console.error('Download backup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
