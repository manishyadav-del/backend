import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

function escapeCSV(val) {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const submissions = await prisma.formSubmission.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Form Type',
      'Message',
      'Status',
      'Notes',
      'Created At'
    ];

    const rows = submissions.map(sub => [
      sub.id,
      sub.name,
      sub.email,
      sub.phone,
      sub.formType,
      sub.message,
      sub.status,
      sub.notes,
      sub.createdAt.toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="forms_${projectId}.csv"`,
      },
    });
  } catch (error) {
    console.error('Forms export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
