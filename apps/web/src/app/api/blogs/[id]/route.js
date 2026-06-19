import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/blogs/[id] - Get single blog
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Get blog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/blogs/[id] - Update blog
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { title, content, excerpt, slug, category, featuredImage, author, status, publishedAt, scheduledAt, seoTitle, seoDescription } = body;

    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== blog.slug) {
      const existing = await prisma.blog.findFirst({
        where: {
          projectId: blog.projectId,
          slug,
          id: { not: id }
        }
      });

      if (existing) {
        return NextResponse.json({ error: 'Blog with this slug already exists' }, { status: 400 });
      }
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(slug && { slug }),
        ...(category !== undefined && { category }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(author !== undefined && { author }),
        ...(status && { status }),
        ...(publishedAt !== undefined && { publishedAt }),
        ...(scheduledAt !== undefined && { scheduledAt }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(status === 'published' && { publishedAt: new Date() }),
      },
    });

    return NextResponse.json({ blog: updatedBlog });
  } catch (error) {
    console.error('Update blog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/blogs/[id] - Delete blog
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    await prisma.blog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete blog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}