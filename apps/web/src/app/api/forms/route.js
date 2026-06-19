import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { createNotification } from '@/lib/notify.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const submissions = await prisma.formSubmission.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ submissions });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { projectId, formType, name, email, phone, message, data, status, notes, leadId } = body;

  const submission = await prisma.formSubmission.create({
    data: {
      projectId,
      formType: formType || 'contact',
      name,
      email,
      phone,
      message,
      data,
      status: status || 'new',
      notes,
      leadId,
    },
  });

  // Generate an auto-notification
  await createNotification(
    projectId,
    'form',
    'New Form Submission',
    `Received a new ${formType || 'contact'} submission from ${name || email || 'Anonymous'}.`,
    '/dashboard/leads' // Or dashboard/forms if a separate tab/page exists, but leads is general
  );

  return NextResponse.json({ submission });
}