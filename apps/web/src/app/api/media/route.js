import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const media = await prisma.media.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ media });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { projectId, filename, originalName, url, thumbnail, mimeType, size, altText, folder, width, height } = body;

  const media = await prisma.media.create({
    data: {
      projectId,
      filename,
      originalName,
      url,
      thumbnail,
      mimeType,
      size,
      altText,
      folder: folder || 'root',
      width,
      height,
    },
  });

  return NextResponse.json({ media });
}