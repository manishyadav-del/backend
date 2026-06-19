import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { createNotification } from '@/lib/notify.js';
import { validateBody, leadSchema } from '@/lib/validate.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const leads = await prisma.lead.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ leads });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { data, error } = validateBody(leadSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const { projectId, name, email, phone, serviceInterest, sourcePage, source, status, notes } = body;

    const lead = await prisma.lead.create({
      data: {
        projectId,
        name,
        email,
        phone,
        serviceInterest,
        sourcePage,
        source,
        status: status || 'new',
        notes,
      },
    });

    // Generate an auto-notification
    await createNotification(
      projectId,
      'lead',
      'New Lead Registered',
      `Lead ${name || email || 'Anonymous'} has registered interest in ${serviceInterest || 'general'}.`,
      '/dashboard/leads'
    );

    return NextResponse.json({ lead });
  } catch (err) {
    console.error('Lead create error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}