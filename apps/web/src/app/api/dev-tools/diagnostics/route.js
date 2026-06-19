import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const dbStart = Date.now();
  let dbStatus = 'connected';
  let dbMs = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbMs = Date.now() - dbStart;
  } catch {
    dbStatus = 'error';
  }

  const envCheck = {
    JWT_SECRET: !!process.env.JWT_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
  };

  const mem = process.memoryUsage();

  return NextResponse.json({
    success: true,
    data: {
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: Math.floor(process.uptime()),
        pid: process.pid,
        memory: {
          heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
          heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
          rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
        },
      },
      database: { status: dbStatus, responseMs: dbMs },
      environment: envCheck,
      nextjs: { appDir: true, runtime: 'nodejs' },
      timestamp: new Date().toISOString(),
    },
  });
}
