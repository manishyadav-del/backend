import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all users
export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json({
    users,
  });
}

// CREATE user
export async function POST(request) {
  const body = await request.json();

  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role || 'viewer',
    },
  });

  return NextResponse.json({ user });
}