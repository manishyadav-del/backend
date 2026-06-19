import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth.js';
import { unstable_cache, revalidateTag } from 'next/cache';

const getCachedGlobalSettings = unstable_cache(
  async (apiKey) => {
    const project = await prisma.project.findUnique({
      where: { apiKey },
      include: {
        contacts: true,
        navigation: true,
      }
    });

    if (!project) return null;

    const globalSettings = await prisma.globalSetting.findUnique({
      where: { projectId: project.id }
    });

    // Parse analytics JSON
    let analytics = {};
    try {
      analytics = globalSettings?.analytics ? JSON.parse(globalSettings.analytics) : {};
    } catch { /* ignore */ }

    // Parse header/footer settings
    let headerSettings = {};
    let footerSettings = {};
    try {
      headerSettings = globalSettings?.headerSettings ? JSON.parse(globalSettings.headerSettings) : {};
      footerSettings = globalSettings?.footerSettings ? JSON.parse(globalSettings.footerSettings) : {};
    } catch { /* ignore */ }

    // Build navigation structure
    const mainMenu = project.navigation.find(n => n.location === 'main');
    const footerMenu = project.navigation.find(n => n.location === 'footer');
    let mainMenuItems = [];
    let footerMenuItems = [];
    try {
      mainMenuItems = mainMenu ? JSON.parse(mainMenu.items) : [];
      footerMenuItems = footerMenu ? JSON.parse(footerMenu.items) : [];
    } catch { /* ignore */ }

    return {
      project: {
        name: project.name,
        domain: project.domain,
        status: project.status,
      },
      brand: {
        logo: globalSettings?.logo || project.logo,
        favicon: globalSettings?.favicon || project.favicon,
        brandColor: globalSettings?.brandColor || project.brandColor,
      },
      header: {
        ...headerSettings,
        menu: mainMenuItems,
      },
      footer: {
        ...footerSettings,
        menu: footerMenuItems,
      },
      analytics: {
        googleAnalytics: analytics.gaId || analytics.googleAnalytics || null,
        tagManager: analytics.gtmId || analytics.tagManager || null,
        clarity: analytics.clarityId || analytics.clarity || null,
        metaPixel: analytics.metaPixelId || analytics.metaPixel || null,
        linkedinTag: analytics.linkedinTagId || analytics.linkedinTag || null,
        searchConsole: analytics.searchConsoleId || analytics.searchConsole || null,
      },
      contacts: project.contacts.map(c => ({
        type: c.type,
        label: c.label,
        value: c.value,
        icon: c.icon,
      })),
      maintenance: globalSettings?.maintenanceMode || false,
      cookieConsent: globalSettings?.cookieConsent ?? true,
    };
  },
  ['global-settings'],
  { tags: ['global-settings'] }
);

/**
 * GET /api/global-settings?apiKey=xxx
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('apiKey');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 401 });
  }

  try {
    const data = await getCachedGlobalSettings(apiKey);
    if (!data) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Global settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/global-settings
 * Used by admin dashboard to update brand config, compliance settings, or analytics.
 */
export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, ...settingsToUpdate } = body;
    const pId = projectId || 'default';

    // Verify project exists
    let project = await prisma.project.findUnique({ where: { id: pId } });
    if (!project) {
      // Fallback: If project 'default' doesn't exist, create it to avoid FKey issues
      if (pId === 'default') {
        project = await prisma.project.create({
          data: {
            id: 'default',
            name: 'Default Project',
            apiKey: 'gbl_api_key_default_2024',
            status: 'active'
          }
        });
      } else {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    const updateData = {};
    if (settingsToUpdate.brandColor !== undefined) updateData.brandColor = settingsToUpdate.brandColor;
    if (settingsToUpdate.maintenanceMode !== undefined) updateData.maintenanceMode = settingsToUpdate.maintenanceMode;
    if (settingsToUpdate.analytics !== undefined) updateData.analytics = settingsToUpdate.analytics;
    if (settingsToUpdate.cookieConsent !== undefined) updateData.cookieConsent = settingsToUpdate.cookieConsent;
    if (settingsToUpdate.formConsent !== undefined) updateData.formConsent = settingsToUpdate.formConsent;
    if (settingsToUpdate.privacyAccept !== undefined) updateData.privacyAccept = settingsToUpdate.privacyAccept;
    if (settingsToUpdate.marketingConsent !== undefined) updateData.marketingConsent = settingsToUpdate.marketingConsent;
    if (settingsToUpdate.logo !== undefined) updateData.logo = settingsToUpdate.logo;
    if (settingsToUpdate.favicon !== undefined) updateData.favicon = settingsToUpdate.favicon;

    const settings = await prisma.globalSetting.upsert({
      where: { projectId: project.id },
      update: updateData,
      create: { projectId: project.id, ...updateData },
    });

    // Invalidate cached layouts on the frontend on-demand
    revalidateTag('global-settings');

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'settings.updated',
        entity: 'GlobalSetting',
        entityId: settings.id,
        details: 'Global settings updated',
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Global settings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}