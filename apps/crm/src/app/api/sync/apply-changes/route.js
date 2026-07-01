import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';
import { broadcastToWebsite } from '@/lib/socket.js';

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all connected websites
    const websites = await prisma.website.findMany({
      where: { status: 'connected' }
    });

    const results = [];

    // Loop through each and broadcast a refresh sync signal
    for (const site of websites) {
      const success = broadcastToWebsite(site.id, 'website:sync', {
        type: 'refresh',
        action: 'REFRESH',
        message: 'Administrator pushed new updates. Refreshing client content.',
        timestamp: new Date().toISOString()
      });

      // Log in SyncLog
      await prisma.syncLog.create({
        data: {
          websiteId: site.id,
          action: 'APPLY_CHANGES',
          status: success ? 'success' : 'failure',
          details: `Global administrator triggered 'Apply Changes'. Broadcast refresh sent.`
        }
      });

      results.push({
        id: site.id,
        name: site.name,
        domain: site.domain,
        synced: success
      });
    }

    return NextResponse.json({
      success: true,
      websitesCount: websites.length,
      syncedWebsites: results,
      message: `Successfully propagated all changes to ${websites.length} connected website(s).`
    });

  } catch (error) {
    console.error('[Apply Changes API] Error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
