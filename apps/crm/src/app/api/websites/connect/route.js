import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function POST(request) {
  try {
    const body = await request.json();
    const { apiKey, name, domain, framework, frameworkVersion, environment, sdkVersion, websiteId } = body;

    if (!apiKey || !domain) {
      return NextResponse.json({ success: false, error: 'Missing required fields: apiKey, domain' }, { status: 400 });
    }

    // Verify Project API Key
    const project = await prisma.project.findUnique({ where: { apiKey } });
    if (!project) {
      return NextResponse.json({ success: false, error: 'Invalid API Key' }, { status: 401 });
    }

    const targetWebsiteId = websiteId || `web_${Math.random().toString(36).substr(2, 9)}`;

    // Find if website already exists
    const existingWebsite = await prisma.website.findUnique({
      where: { domain }
    });

    let website;
    if (existingWebsite) {
      website = await prisma.website.update({
        where: { id: existingWebsite.id },
        data: {
          name: name || existingWebsite.name,
          framework: framework || existingWebsite.framework,
          frameworkVersion: frameworkVersion || existingWebsite.frameworkVersion,
          sdkVersion: sdkVersion || existingWebsite.sdkVersion,
          environment: environment || existingWebsite.environment,
          status: 'connected',
          lastSyncedAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      website = await prisma.website.create({
        data: {
          id: targetWebsiteId,
          name: name || `${project.name} client - ${domain}`,
          domain,
          framework: framework || 'nextjs',
          frameworkVersion: frameworkVersion || null,
          sdkVersion: sdkVersion || null,
          environment: environment || 'development',
          apiKey,
          status: 'connected',
          lastSyncedAt: new Date()
        }
      });
    }

    // Also mirror to ConnectedWebsite
    const existingConnected = await prisma.connectedWebsite.findUnique({ where: { domain } });
    if (!existingConnected) {
      await prisma.connectedWebsite.create({
        data: {
          id: website.id,
          name: website.name,
          domain: website.domain,
          ipAddress: '127.0.0.1',
          framework: website.framework,
          frameworkVersion: website.frameworkVersion,
          sdkVersion: website.sdkVersion,
          authToken: website.syncToken || 'sync_token_default',
          status: website.status,
          environment: website.environment || 'development',
          lastSyncedAt: new Date()
        }
      });
    } else {
      await prisma.connectedWebsite.update({
        where: { id: existingConnected.id },
        data: {
          name: website.name,
          framework: website.framework,
          frameworkVersion: website.frameworkVersion,
          sdkVersion: website.sdkVersion,
          status: website.status,
          environment: website.environment || 'development',
          lastSyncedAt: new Date()
        }
      });
    }

    // Issue JWT sync token
    const syncToken = jwt.sign(
      { websiteId: website.id, projectId: project.id, domain: website.domain },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Save token to database and update website record
    await prisma.website.update({
      where: { id: website.id },
      data: { syncToken }
    });

    try {
      await prisma.websiteToken.create({
        data: {
          websiteId: website.id,
          token: syncToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      });
    } catch (e) {
      console.log('Token entry skip/error:', e.message);
    }

    // Create sync log
    await prisma.syncLog.create({
      data: {
        websiteId: website.id,
        action: 'CONNECT',
        status: 'success',
        details: `Successfully registered website: ${domain} (Framework: ${framework} ${frameworkVersion}).`
      }
    });

    return NextResponse.json({
      success: true,
      websiteId: website.id,
      syncToken,
      message: 'Website connected and registered successfully.'
    });

  } catch (error) {
    console.error('Website connect error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
