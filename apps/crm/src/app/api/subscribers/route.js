import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || 'demo';

  try {
    const subscribers = await prisma.subscriber.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        lists: {
          include: {
            list: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, subscribers });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { projectId = 'demo', email, name, status = 'active', tags, metadata } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.upsert({
      where: {
        projectId_email: {
          projectId,
          email
        }
      },
      update: {
        name,
        status,
        tags,
        metadata
      },
      create: {
        projectId,
        email,
        name,
        status,
        tags,
        metadata
      }
    });

    return NextResponse.json({ success: true, subscriber });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
