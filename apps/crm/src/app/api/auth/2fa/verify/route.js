import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import speakeasy from 'speakeasy';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { token, secret } = body;

  if (!token || !secret) {
    return NextResponse.json({ error: 'Token and secret are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret || secret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
  }

  // Enable 2FA
  await prisma.user.update({
    where: { id: authUser.id },
    data: { twoFactorEnabled: true },
  });

  return NextResponse.json({ success: true, message: '2FA enabled successfully' });
}