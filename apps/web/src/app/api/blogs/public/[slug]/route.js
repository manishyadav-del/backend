import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma.js';

export async function GET(request, context) {
  try {
    const params = context.params ? await context.params : {};
    const slug = params.slug;
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId') || 'demo';

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const blog = await prisma.blog.findFirst({
      where: {
        projectId,
        slug,
        status: 'published'
      }
    });

    if (!blog) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ blog }, { status: 200 });
  } catch (error) {
    console.error('[Public Blog API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
