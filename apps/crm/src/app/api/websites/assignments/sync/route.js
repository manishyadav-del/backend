import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { decryptText } from '@/lib/encryption.js';
import { broadcastToWebsite } from '@/lib/socket.js';

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleKey, websiteIds } = body;

    if (!moduleKey || !Array.isArray(websiteIds) || websiteIds.length === 0) {
      return NextResponse.json({ error: 'moduleKey and websiteIds are required' }, { status: 400 });
    }

    const moduleItem = await prisma.connectedWebsiteModule.findUnique({
      where: { key: moduleKey }
    });

    if (!moduleItem) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // 1. Package the module data to synchronize
    let moduleData = {};
    if (moduleKey === 'seo') {
      const seoRecords = await prisma.sEO.findMany({ include: { page: true } });
      moduleData = { seo: seoRecords };
    } else if (moduleKey === 'content') {
      const pageSections = await prisma.pageSection.findMany();
      const media = await prisma.media.findMany();
      const pages = await prisma.page.findMany();
      const blogs = await prisma.blog.findMany();
      moduleData = { sections: pageSections, media, pages, blogs };
    } else if (moduleKey === 'crm') {
      const ctas = await prisma.cTA.findMany();
      const popups = await prisma.popup.findMany();
      moduleData = { ctas, popups };
    } else if (moduleKey === 'reputation') {
      const FAQs = await prisma.fAQ.findMany();
      const testimonials = await prisma.testimonial.findMany();
      moduleData = { FAQs, testimonials };
    } else if (moduleKey === 'users') {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, status: true }
      });
      moduleData = { users };
    } else if (moduleKey === 'builder') {
      const settings = await prisma.globalSetting.findFirst();
      const navigation = await prisma.navigation.findMany();
      moduleData = {
        headerSettings: settings?.headerSettings ? JSON.parse(settings.headerSettings) : null,
        footerSettings: settings?.footerSettings ? JSON.parse(settings.footerSettings) : null,
        navigation
      };
    } else if (moduleKey === 'legal') {
      const legalPages = await prisma.legalPage.findMany();
      moduleData = { legalPages };
    } else if (moduleKey === 'security') {
      const roles = await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } });
      const settings = await prisma.globalSetting.findFirst({
        select: { cookieConsent: true, formConsent: true, privacyAccept: true, marketingConsent: true }
      });
      moduleData = { roles, settings };
    } else if (moduleKey === 'system') {
      const emailSettings = await prisma.emailSetting.findFirst();
      const backups = await prisma.backup.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
      moduleData = { emailSettings, backups };
    } else {
      // Default placeholder config payload for custom modules
      moduleData = { placeholder: true, syncedAt: new Date().toISOString() };
    }

    const syncResults = [];

    // 2. Perform sync for each website
    for (const websiteId of websiteIds) {
      const website = await prisma.connectedWebsite.findUnique({
        where: { id: websiteId }
      });

      if (!website) continue;

      const decryptedToken = decryptText(website.authToken);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const agentSyncUrl = website.apiUrl 
        ? `${website.apiUrl}/sync-module` 
        : (website.domain.startsWith('http') ? `${website.domain}/api/agent/sync-module` : `http://${website.domain}/api/agent/sync-module`);

      let success = true;
      let errorMsg = null;

      try {
        const res = await fetch(agentSyncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${decryptedToken}`,
            'User-Agent': 'GlobalBackendConnector/1.0'
          },
          body: JSON.stringify({ moduleKey, data: moduleData }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          success = false;
          errorMsg = `External Agent returned status: ${res.status}`;
        }
      } catch (err) {
        success = false;
        errorMsg = err.message;
      }

      // Update Module Assignment Status
      await prisma.moduleAssignment.updateMany({
        where: {
          websiteId,
          moduleId: moduleItem.id
        },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: success ? 'synced' : 'error'
        }
      });

      // Write to Sync Log
      await prisma.websiteSyncLog.create({
        data: {
          websiteId,
          moduleKey,
          action: `SYNC_${moduleKey.toUpperCase()}`,
          status: success ? 'success' : 'failure',
          errorMsg: errorMsg
        }
      });

      // Save to website logs
      await prisma.connectedWebsiteLog.create({
        data: {
          websiteId,
          action: 'SYNC_MODULE',
          status: success ? 'success' : 'failure',
          details: success 
            ? `Successfully pushed settings updates for module "${moduleKey}" to external site.`
            : `Failed pushing settings updates for module "${moduleKey}" to external site: ${errorMsg}`
        }
      });

      // Broadcast Socket.io Event
      broadcastToWebsite(websiteId, 'module:sync', { 
        moduleKey, 
        status: success ? 'synced' : 'error',
        timestamp: new Date().toISOString()
      });

      syncResults.push({ websiteId, success, error: errorMsg });
    }

    return NextResponse.json({ success: true, results: syncResults });
  } catch (error) {
    console.error('Module sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
