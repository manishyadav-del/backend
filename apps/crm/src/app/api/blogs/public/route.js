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

export async function GET(request) {
  try {
    const project = await getProjectByApiKey(request);
    if (!project) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status') || 'published';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const pagePath = url.searchParams.get('pagePath');
    const skip = (page - 1) * limit;

    const where = {
      projectId: project.id,
      status: status.toLowerCase()
    };

    if (category) {
      where.category = category;
    }

    if (pagePath) {
      where.targetPages = {
        contains: `"${pagePath}"`
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.blog.count({ where })
    ]);

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Public Blogs API] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const project = await getProjectByApiKey(request);
    if (!project) {
      return NextResponse.json({ error: 'Unauthorized - Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug, content, excerpt, category, featuredImage, author, status, publishedAt, seoTitle, seoDescription, targetPages } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    // Check for slug conflict within the project
    const existing = await prisma.blog.findFirst({ where: { slug, projectId: project.id } });
    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content: content || '',
        excerpt: excerpt || '',
        category: category || 'General',
        featuredImage: featuredImage || '',
        author: author || 'Admin',
        status: status || 'published',
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt || '',
        projectId: project.id,
        targetPages: Array.isArray(targetPages) ? JSON.stringify(targetPages) : targetPages || null,
      }
    });

    return NextResponse.json({ blog }, { status: 201 });
  } catch (error) {
    console.error('[Public Blogs API] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
