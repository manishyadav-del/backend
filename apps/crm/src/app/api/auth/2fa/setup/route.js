import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function POST(request) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const secret = speakeasy.generateSecret({
    name: `Global Backend (${user.email})`,
  });

  const otpauthUrl = secret.otpauth_url;

  // Store secret temporarily (not enabled yet)
  await prisma.user.update({
    where: { id: authUser.id },
    data: { twoFactorSecret: secret.base32 },
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({
    secret: secret.base32,
    qrCode: qrCodeDataUrl,
    otpauthUrl,
  });
}