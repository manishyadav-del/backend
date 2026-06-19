import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const blogs = await prisma.blog.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ blogs });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { projectId, title, content, excerpt, slug, category, featuredImage, author, status, publishedAt, scheduledAt, seoTitle, seoDescription } = body;

  const blog = await prisma.blog.create({
    data: {
      projectId,
      title,
      content,
      excerpt,
      slug,
      category,
      featuredImage,
      author,
      status: status || 'draft',
      publishedAt,
      scheduledAt,
      seoTitle,
      seoDescription,
    },
  });

  return NextResponse.json({ blog });
}