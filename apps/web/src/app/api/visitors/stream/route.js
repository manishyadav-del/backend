import prisma from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendData = async () => {
        try {
          const cutoff = new Date(Date.now() - 30 * 1000); // 30 seconds

          const [activeSessions, totalToday, byPage, byDevice, bySource] = await Promise.all([
            prisma.visitorSession.findMany({
              where: { projectId, isActive: true, lastSeen: { gte: cutoff } },
              orderBy: { lastSeen: 'desc' },
              take: 50,
            }),
            prisma.visitorSession.count({
              where: { projectId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            }),
            prisma.visitorSession.groupBy({
              by: ['page'],
              where: { projectId, isActive: true, lastSeen: { gte: cutoff } },
              _count: { page: true },
              orderBy: { _count: { page: 'desc' } },
              take: 10,
            }),
            prisma.visitorSession.groupBy({
              by: ['device'],
              where: { projectId, isActive: true, lastSeen: { gte: cutoff } },
              _count: { device: true },
            }),
            prisma.visitorSession.groupBy({
              by: ['source'],
              where: { projectId, isActive: true, lastSeen: { gte: cutoff } },
              _count: { source: true },
              orderBy: { _count: { source: 'desc' } },
              take: 5,
            }),
          ]);

          const payload = {
            activeCount: activeSessions.length,
            totalToday,
            sessions: activeSessions.map((s) => ({
              id: s.id,
              page: s.page,
              ip: s.ip,
              country: s.country,
              device: s.device,
              browser: s.browser,
              source: s.source,
              lastSeen: s.lastSeen,
              duration: s.duration,
            })),
            byPage: byPage.map((p) => ({ page: p.page, count: p._count.page })),
            byDevice: byDevice.map((d) => ({ device: d.device || 'Unknown', count: d._count.device })),
            bySource: bySource.map((s) => ({ source: s.source || 'direct', count: s._count.source })),
            timestamp: new Date().toISOString(),
          };

          const msg = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(msg));
        } catch (err) {
          console.error('SSE error:', err);
        }
      };

      // Send immediately
      await sendData();

      // Then every 5 seconds
      const interval = setInterval(sendData, 5000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
