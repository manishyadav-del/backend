import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma.js';

async function getProjectByApiKey(request) {
  const headerApiKey = request.headers.get('x-api-key');
  const url = new URL(request.url);
  const queryApiKey = url.searchParams.get('apiKey');
  const apiKey = headerApiKey || queryApiKey;
  if (!apiKey) return null;
  return await prisma.project.findFirst({ where: { apiKey } });
}

export async function GET(request) {
  try {
    const project = await getProjectByApiKey(request);
    if (!project) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const isVisible = url.searchParams.get('isVisible');

    const where = {
      projectId: project.id,
    };

    if (isVisible !== null && isVisible !== undefined) {
      where.isActive = isVisible === 'true';
    } else {
      where.isActive = true;
    }

    if (type) {
      where.type = type;
    }

    const popups = await prisma.popup.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ popups }, { status: 200 });
  } catch (error) {
    console.error('[Public Popups API] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
