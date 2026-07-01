import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  // Get all visitor sessions for the project
  const sessions = await prisma.visitorSession.findMany({
    where: { projectId }
  });

  const totalSessions = sessions.length;
  const totalPageViews = sessions.reduce((sum, s) => sum + (s.pageViews || 1), 0);
  
  // Unique visitors based on distinct IP addresses (fallback to session ID if IP is missing)
  const uniqueIps = new Set();
  sessions.forEach(s => {
    if (s.ip) uniqueIps.add(s.ip);
    else if (s.sessionId) uniqueIps.add(s.sessionId);
  });
  const totalVisitors = uniqueIps.size;

  const bouncedSessions = sessions.filter(s => s.pageViews === 1).length;
  const bounceRate = totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0;

  // Grouping helper
  const groupAndCount = (key, defaultLabel = 'Direct / Unknown') => {
    const counts = {};
    sessions.forEach(s => {
      const val = s[key] || defaultLabel;
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // top 10 results
  };

  const landingPages = groupAndCount('landingPage', '/');
  const exitPages = groupAndCount('exitPage', '/');
  const trafficSources = groupAndCount('source', 'Direct / Unknown');
  const deviceAnalytics = groupAndCount('device', 'Desktop');
  const browserAnalytics = groupAndCount('browser', 'Chrome');
  const countryAnalytics = groupAndCount('country', 'United States');

  return NextResponse.json({
    success: true,
    stats: {
      totalVisitors,
      totalSessions,
      totalPageViews,
      bounceRate,
    },
    landingPages,
    exitPages,
    trafficSources,
    deviceAnalytics,
    browserAnalytics,
    countryAnalytics,
    recentSessions: sessions.slice(0, 15) // Recent 15 sessions
  });
}
