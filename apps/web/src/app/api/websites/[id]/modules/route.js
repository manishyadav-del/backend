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

    const website = await prisma.connectedWebsite.findUnique({
      where: { id },
      select: { modules: true }
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Default configuration for modules
    const defaultModules = {
      dashboard: true,
      users: true,
      roles: true,
      crm: false,
      projects: false,
      tasks: false,
      reports: false,
      notifications: true,
      settings: true,
      customModules: false
    };

    let activeModules = defaultModules;
    if (website.modules) {
      try {
        activeModules = { ...defaultModules, ...JSON.parse(website.modules) };
      } catch (e) {
        console.error('Failed parsing modules configuration:', e);
      }
    }

    return NextResponse.json({ success: true, data: activeModules });
  } catch (error) {
    console.error('Get modules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { modules } = body;

    if (!modules) {
      return NextResponse.json({ error: 'Modules configuration is required' }, { status: 400 });
    }

    const website = await prisma.connectedWebsite.findUnique({
      where: { id }
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const serializedModules = JSON.stringify(modules);

    // Update locally
    const updated = await prisma.connectedWebsite.update({
      where: { id },
      data: {
        modules: serializedModules,
        syncStatus: 'synced',
        lastSyncedAt: new Date()
      }
    });

    // Sync to external website agent
    const decryptedToken = decryptText(website.authToken);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const agentModulesUrl = website.apiUrl 
      ? `${website.apiUrl}/modules` 
      : (website.domain.startsWith('http') ? `${website.domain}/api/agent/modules` : `http://${website.domain}/api/agent/modules`);

    let syncSuccess = true;
    let syncError = null;

    try {
      const res = await fetch(agentModulesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decryptedToken}`,
          'User-Agent': 'GlobalBackendConnector/1.0'
        },
        body: JSON.stringify({ modules }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        syncSuccess = false;
        syncError = `Agent returned status: ${res.status}`;
      }
    } catch (err) {
      syncSuccess = false;
      syncError = err.message;
    }

    // Update website sync status if failed
    if (!syncSuccess) {
      await prisma.connectedWebsite.update({
        where: { id },
        data: { syncStatus: 'error' }
      });
    }

    // Save sync audit log
    await prisma.connectedWebsiteLog.create({
      data: {
        websiteId: id,
        action: 'SYNC_MODULES',
        status: syncSuccess ? 'success' : 'failure',
        details: syncSuccess 
          ? `Synchronized module toggles successfully to external agent: ${serializedModules}`
          : `Saved module toggles locally, but failed synchronizing to external agent (${syncError}).`
      }
    });

    return NextResponse.json({ success: true, data: modules, synced: syncSuccess });
  } catch (error) {
    console.error('Update modules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
