import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const userId = searchParams.get('userId');
  const success = searchParams.get('success');

  const where = {};
  if (authUser.role !== 'admin') {
    where.userId = authUser.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (success !== null && success !== '') {
    where.success = success === 'true';
  }

  const [history, total] = await Promise.all([
    prisma.loginHistory.findMany({
      where,
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loginHistory.count({ where }),
  ]);

  return NextResponse.json({
    history,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}