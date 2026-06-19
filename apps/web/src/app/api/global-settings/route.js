import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/global-settings?apiKey=xxx
 * 
 * Centralized endpoint for frontend to fetch:
 * - Header/Footer configuration
 * - Analytics tracking IDs
 * - Brand settings (logo, favicon, colors)
 * - Contact info
 * 
 * Used by the Next.js Root Layout to dynamically render
 * site-wide elements without hardcoding.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('apiKey');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 401 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { apiKey },
      include: {
        contacts: true,
        navigation: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 404 });
    }

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

    return NextResponse.json({
      success: true,
      data: {
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
          googleAnalytics: analytics.gaId || null,
          tagManager: analytics.gtmId || null,
          clarity: analytics.clarityId || null,
          metaPixel: analytics.metaPixelId || null,
          linkedinTag: analytics.linkedinTagId || null,
          searchConsole: analytics.searchConsoleId || null,
        },
        contacts: project.contacts.map(c => ({
          type: c.type,
          label: c.label,
          value: c.value,
          icon: c.icon,
        })),
        maintenance: globalSettings?.maintenanceMode || false,
        cookieConsent: globalSettings?.cookieConsent ?? true,
      }
    });
  } catch (error) {
    console.error('Global settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}