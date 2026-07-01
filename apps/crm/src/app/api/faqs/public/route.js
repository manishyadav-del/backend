import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKey.js';
import { parseQuery } from '@/lib/apiHandler.js';
import { prisma } from '@/lib/prisma.js';

/**
 * Public FAQs endpoint — accessible via API key for frontend users/SDKs.
 * GET /api/faqs/public?apiKey=xxx
 * POST /api/faqs/public?apiKey=xxx
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

    // Only return answered and visible FAQs
    const faqs = await prisma.fAQ.findMany({
      where: {
        projectId: project.id,
        isVisible: true,
        NOT: {
          answer: '',
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json({ success: true, faqs });
  } catch (err) {
    console.error('[Public FAQs API GET]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
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

    const body = await request.json();
    const { question, serviceId, pageId } = body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    // Create a new unanswered (pending) FAQ for moderation
    const faq = await prisma.fAQ.create({
      data: {
        projectId: project.id,
        question: question.trim(),
        answer: '',
        isVisible: false, // Must be approved and answered by admin
        serviceId: serviceId || null,
        pageId: pageId || null,
      },
    });

    return NextResponse.json({ success: true, message: 'Question submitted successfully and is pending review', faq });
  } catch (err) {
    console.error('[Public FAQs API POST]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
