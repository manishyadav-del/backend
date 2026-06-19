import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma.js';
import { sendPasswordResetEmail } from '@/lib/email.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      // Invalidate any existing unused tokens
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      await sendPasswordResetEmail(normalizedEmail, token);

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'auth.password_reset_requested',
          entity: 'User',
          entityId: user.id,
          details: `Password reset requested for ${normalizedEmail}`,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}