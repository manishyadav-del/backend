import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKey.js';
import { parseQuery } from '@/lib/apiHandler.js';
import { prisma } from '@/lib/prisma.js';

/**
 * Public Testimonials Endpoint
 * GET /api/testimonials/public - Get testimonials for a website project
 * POST /api/testimonials/public - Submit a testimonial from the public frontend
 */
export async function GET(request) {
  try {
    const query = parseQuery(request);
    const apiKeyValue = query.apiKey || request.headers.get('x-api-key');

    if (!apiKeyValue) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const project = await validateApiKey(apiKeyValue);
    if (!project) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const testimonials = await prisma.testimonial.findMany({
      where: {
        projectId: project.id,
        isVisible: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, testimonials });
  } catch (err) {
    console.error('[Public Testimonials GET Error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKeyValue = searchParams.get('apiKey') || request.headers.get('x-api-key');

    if (!apiKeyValue) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const project = await validateApiKey(apiKeyValue);
    if (!project) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const { clientName, clientImage, rating, content, company, role } = body;

    if (!clientName || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        projectId: project.id,
        clientName,
        clientImage: clientImage || '',
        rating: Number(rating) || 5,
        content,
        company: company || '',
        role: role || '',
        isVisible: false, // Default to invisible until approved in the dashboard backend!
      },
    });

    return NextResponse.json({ success: true, testimonial });
  } catch (err) {
    console.error('[Public Testimonials POST Error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
