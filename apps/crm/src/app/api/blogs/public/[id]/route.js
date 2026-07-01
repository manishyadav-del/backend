import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma.js';

async function getProjectByApiKey(request) {
  const headerApiKey = request.headers.get('x-api-key');
  const url = new URL(request.url);
  const queryApiKey = url.searchParams.get('apiKey');
  const apiKey = headerApiKey || queryApiKey;
  if (!apiKey) return null;
  const project = await prisma.project.findFirst({ where: { apiKey } });
  return project;
}

// GET /api/blogs/public/[id] — fetch blog by ID or slug
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('apiKey') || request.headers.get('x-api-key');

    let projectId = null;
    if (apiKey) {
      const project = await prisma.project.findFirst({ where: { apiKey } });
      if (project) projectId = project.id;
    }

    // Try to find by ID first, then by slug
    const blog = await prisma.blog.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        ...(projectId ? { projectId } : {}),
        status: 'published'
      },
      include: {
        blogCategory: true,
        tags: true,
        comments: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ blog }, { status: 200 });
  } catch (error) {
    console.error('[Public Blogs API] GET by ID Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/blogs/public/[id] — update blog via API key
export async function PUT(request, { params }) {
  try {
    const project = await getProjectByApiKey(request);
    if (!project) {
      return NextResponse.json({ error: 'Unauthorized - Invalid API key' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, slug, content, excerpt, category, featuredImage, author, status, publishedAt, seoTitle, seoDescription } = body;

    // Verify blog belongs to this project
    const existing = await prisma.blog.findFirst({
      where: { OR: [{ id }, { slug: id }], projectId: project.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // If slug is changing, check for conflict
    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.blog.findFirst({
        where: { slug, projectId: project.id, NOT: { id: existing.id } }
      });
      if (slugConflict) {
        return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (category !== undefined) updateData.category = category;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (author !== undefined) updateData.author = author;
    if (status !== undefined) updateData.status = status;
    if (publishedAt !== undefined) updateData.publishedAt = new Date(publishedAt);
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    updateData.updatedAt = new Date();

    const blog = await prisma.blog.update({
      where: { id: existing.id },
      data: updateData
    });

    return NextResponse.json({ blog }, { status: 200 });
  } catch (error) {
    console.error('[Public Blogs API] PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/blogs/public/[id] — delete blog via API key
export async function DELETE(request, { params }) {
  try {
    const project = await getProjectByApiKey(request);
    if (!project) {
      return NextResponse.json({ error: 'Unauthorized - Invalid API key' }, { status: 401 });
    }

    const { id } = await params;

    // Verify blog belongs to this project
    const existing = await prisma.blog.findFirst({
      where: { OR: [{ id }, { slug: id }], projectId: project.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    await prisma.blog.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Public Blogs API] DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
