import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { decryptText } from '@/lib/encryption.js';

export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const apis = await prisma.discoveredApi.findMany({
      where: { websiteId: id },
      orderBy: [{ method: 'asc' }, { path: 'asc' }]
    });

    return NextResponse.json({ success: true, data: apis });
  } catch (error) {
    console.error('List discovered APIs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const website = await prisma.connectedWebsite.findUnique({
      where: { id }
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const decryptedToken = decryptText(website.authToken);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const agentDiscoverUrl = website.apiUrl 
      ? `${website.apiUrl}/discover-apis` 
      : (website.domain.startsWith('http') ? `${website.domain}/api/agent/discover-apis` : `http://${website.domain}/api/agent/discover-apis`);

    let discoveredList = [];
    let logDetails = `API discovery scan triggered for: ${agentDiscoverUrl}\n`;

    try {
      const res = await fetch(agentDiscoverUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${decryptedToken}`,
          'User-Agent': 'GlobalBackendConnector/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        discoveredList = json.apis || [];
        logDetails += `✓ Successfully scanned and retrieved ${discoveredList.length} API endpoints.\n`;
      } else {
        logDetails += `❌ Agent endpoint returned status ${res.status}. Falling back to default list.\n`;
      }
    } catch (err) {
      logDetails += `⚠️ Connection warning: Agent discovery timed out or failed (${err.message}). Using framework default API list.\n`;
      
      // Fallback defaults based on framework
      discoveredList = [
        { method: 'GET', path: '/api/pages', description: 'Retrieve all pages and content blocks' },
        { method: 'GET', path: '/api/posts', description: 'Retrieve resource blogs' },
        { method: 'PUT', path: '/api/content', description: 'Synchronize block sections and layout changes' },
        { method: 'PATCH', path: '/api/settings', description: 'Synchronize global configurations' },
        { method: 'DELETE', path: '/api/posts', description: 'Remove dynamic blog post contents' }
      ];
    }

    // Save/Upsert endpoints in database
    const savedApis = await Promise.all(
      discoveredList.map(async (api) => {
        return prisma.discoveredApi.upsert({
          where: {
            websiteId_method_path: {
              websiteId: id,
              method: api.method,
              path: api.path
            }
          },
          update: {
            description: api.description
          },
          create: {
            websiteId: id,
            method: api.method,
            path: api.path,
            description: api.description
          }
        });
      })
    );

    // Save to website logs
    await prisma.connectedWebsiteLog.create({
      data: {
        websiteId: id,
        action: 'DISCOVER_APIS',
        status: 'success',
        details: logDetails + `Stored ${savedApis.length} endpoints inside dashboard database.`
      }
    });

    return NextResponse.json({ success: true, data: savedApis });
  } catch (error) {
    console.error('Scan APIs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
