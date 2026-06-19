import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import crypto from 'crypto';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const apiKeys = await prisma.apiKey.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, key: true, isActive: true, lastUsed: true, permissions: true, createdAt: true },
  });

  // Mask key — show only last 8 chars
  const maskedKeys = apiKeys.map((k) => ({
    ...k,
    keyPreview: `****${k.key.slice(-8)}`,
  }));

  return NextResponse.json({ apiKeys: maskedKeys });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { projectId, name, permissions } = body;

    if (!projectId || !name) return NextResponse.json({ error: 'Project ID and name are required' }, { status: 400 });

    const key = `gbk_${crypto.randomBytes(24).toString('hex')}`;

    const apiKey = await prisma.apiKey.create({
      data: { projectId, name, key, permissions: permissions ? JSON.stringify(permissions) : null, isActive: true },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'apikey.created', entity: 'ApiKey', entityId: apiKey.id, details: `Created API key: ${name}` },
    });

    // Return full key ONCE on creation
    return NextResponse.json({ apiKey: { ...apiKey, fullKey: key } }, { status: 201 });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
