import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import crypto from 'crypto';

export async function POST(request, { params }) {
  try {
    if (!getAuthUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const newApiKey = crypto.randomUUID();

    const project = await prisma.project.update({
      where: { id },
      data: { apiKey: newApiKey },
      select: { id: true, apiKey: true }
    });

    return NextResponse.json({ apiKey: project.apiKey });
  } catch (error) {
    console.error('Regenerate key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
