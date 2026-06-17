import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { DEFAULT_HEADER_CONFIG, DEFAULT_FOOTER_CONFIG } from '@/lib/constants.js';

export async function GET(request) {
  try {
    if (!getAuthUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { pages: true }
        }
      }
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!getAuthUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, slug, domain } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const existingProject = await prisma.project.findUnique({ where: { slug } });
    if (existingProject) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
    }

    // Create project and its default global settings
    const project = await prisma.project.create({
      data: {
        name,
        slug,
        domain,
        globalSettings: {
          create: {
            headerConfig: DEFAULT_HEADER_CONFIG,
            footerConfig: DEFAULT_FOOTER_CONFIG,
            siteName: name,
          }
        }
      }
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
