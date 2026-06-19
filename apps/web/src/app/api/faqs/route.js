import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { validateBody, faqSchema } from '@/lib/validate.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const faqs = await prisma.fAQ.findMany({
    where: { projectId },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ faqs });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { data, error } = validateBody(faqSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const { projectId, pageId, serviceId, question, answer, sortOrder, isVisible } = body;

    const faq = await prisma.fAQ.create({
      data: {
        projectId,
        pageId,
        serviceId,
        question,
        answer,
        sortOrder: sortOrder || 0,
        isVisible: isVisible ?? true,
      },
    });

    return NextResponse.json({ faq });
  } catch (err) {
    console.error('FAQ create error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}