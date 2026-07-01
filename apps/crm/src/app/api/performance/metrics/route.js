import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || 'default';

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseMs = Date.now() - dbStart;

    const [
      errorCount24h,
      warnCount24h,
      totalPages,
      totalBlogs,
      totalMedia,
      totalLeads,
      totalUsers,
      totalForms,
      recentErrors,
    ] = await Promise.all([
      prisma.errorLog.count({
        where: { level: 'error', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.errorLog.count({
        where: { level: 'warn', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.page.count({ where: { projectId } }),
      prisma.blog.count({ where: { projectId } }),
      prisma.media.count({ where: { projectId } }),
      prisma.lead.count({ where: { projectId } }),
      prisma.user.count(),
      prisma.formSubmission.count({ where: { projectId } }),
      prisma.errorLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, level: true, message: true, url: true, createdAt: true },
      }),
    ]);

    const mem = process.memoryUsage();
    const uptimeSeconds = process.uptime();
    const cpuLoad = os.loadavg();

    // Try to get uploads folder size
    let storageInfo = { used: 'N/A', path: '/uploads' };
    try {
      const fs = await import('fs');
      const path = await import('path');
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir, { recursive: true });
        let totalBytes = 0;
        for (const file of files) {
          try {
            const stat = fs.statSync(path.join(uploadsDir, file));
            if (stat.isFile()) totalBytes += stat.size;
          } catch { /* skip */ }
        }
        storageInfo.used = `${(totalBytes / 1024 / 1024).toFixed(2)} MB`;
      }
    } catch { /* skip */ }

    return NextResponse.json({
      success: true,
      data: {
        database: {
          status: 'connected',
          responseMs: dbResponseMs,
          health: dbResponseMs < 100 ? 'excellent' : dbResponseMs < 500 ? 'good' : 'slow',
        },
        system: {
          uptime: Math.floor(uptimeSeconds),
          uptimeFormatted: formatUptime(uptimeSeconds),
          nodeVersion: process.version,
          platform: process.platform,
          cpuLoad: cpuLoad[0]?.toFixed(2) || 'N/A',
          memory: {
            heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
            heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
            rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
            usagePercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
          },
        },
        storage: storageInfo,
        errors: {
          last24h: errorCount24h,
          warnings24h: warnCount24h,
          recentErrors,
        },
        records: {
          pages: totalPages,
          blogs: totalBlogs,
          media: totalMedia,
          leads: totalLeads,
          users: totalUsers,
          forms: totalForms,
        },
      },
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${Math.floor(seconds % 60)}s`;
}
