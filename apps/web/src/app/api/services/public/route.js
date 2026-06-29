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
    const search = url.searchParams.get('search');
    const isVisible = url.searchParams.get('isVisible');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const skip = (page - 1) * limit;

    const where = {
      projectId: project.id
    };

    if (isVisible !== null && isVisible !== undefined) {
      where.isVisible = isVisible === 'true';
    } else {
      where.isVisible = true; // default only active/visible services
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
        include: {
          faqs: {
            where: { isVisible: true },
            orderBy: { sortOrder: 'asc' }
          }
        }
      }),
      prisma.service.count({ where })
    ]);

    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Public Services API] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
