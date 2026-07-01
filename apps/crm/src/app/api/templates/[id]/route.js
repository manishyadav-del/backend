import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function PUT(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  try {
    const body = await request.json();
    const { name, subject, htmlContent, designJson } = body;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name,
        subject,
        htmlContent,
        designJson
      }
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  try {
    await prisma.emailTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
