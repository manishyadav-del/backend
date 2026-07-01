import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || 'demo';

  try {
    const accounts = await prisma.socialAccount.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });

    const posts = await prisma.socialPost.findMany({
      where: {
        socialAccount: { projectId }
      },
      include: { socialAccount: true },
      orderBy: { scheduledAt: 'desc' }
    });

    return NextResponse.json({ success: true, accounts, posts });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action } = body;

    // Connect Social Account (Simulated OAuth flow for demo)
    if (action === 'connect') {
      const { projectId = 'demo', platform, accountName } = body;
      
      if (!platform || !accountName) {
        return NextResponse.json({ success: false, error: 'Platform and Account Name are required' }, { status: 400 });
      }

      const account = await prisma.socialAccount.create({
        data: {
          projectId,
          platform,
          accountName,
          accessToken: 'simulated_access_token_' + Math.random().toString(36).substring(2),
        }
      });

      return NextResponse.json({ success: true, account });
    }

    // Schedule post
    if (action === 'schedule') {
      const { socialAccountId, content, mediaUrl, scheduledAt } = body;

      if (!socialAccountId || !content || !scheduledAt) {
        return NextResponse.json({ success: false, error: 'Social Account, Content, and Scheduled Date are required' }, { status: 400 });
      }

      const post = await prisma.socialPost.create({
        data: {
          socialAccountId,
          content,
          mediaUrl,
          scheduledAt: new Date(scheduledAt),
          status: 'scheduled'
        }
      });

      return NextResponse.json({ success: true, post });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
