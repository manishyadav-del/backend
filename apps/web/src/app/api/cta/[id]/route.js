import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function PUT(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, buttonText, link, type, placement, isActive, sortOrder, bgColor, textColor } = body;

    const cta = await prisma.cTA.update({
      where: { id },
      data: { title, buttonText, link, type, placement, isActive, sortOrder, bgColor, textColor },
    });

    return NextResponse.json({ cta });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.cTA.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
