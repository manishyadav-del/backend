import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    
    if (user) {
      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'LOGOUT',
          details: `User logged out: ${user.email}`,
        },
      });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Delete the auth-token cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
