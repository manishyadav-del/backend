import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function POST(request) {
  try {
    const body = await request.json();
    const { apiKey, websiteId, domain, apiUrl, framework } = body;

    if (!apiKey || !websiteId || !domain) {
      return NextResponse.json({ success: false, error: 'Missing required fields: apiKey, websiteId, domain' }, { status: 400 });
    }

    // 1. Verify Project API Key
    const project = await prisma.project.findUnique({
      where: { apiKey }
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Invalid API Key. No associated project found.' }, { status: 401 });
    }

    // 2. Find or Register Website in the new Website table
    let website = await prisma.website.findUnique({
      where: { domain }
    });

    if (!website) {
      website = await prisma.website.create({
        data: {
          id: websiteId,
          name: `${project.name} client - ${domain}`,
          domain,
          framework: framework || 'nextjs',
          apiKey,
          status: 'connected'
        }
      });
    } else {
      // Update existing website credentials if it re-registers
      website = await prisma.website.update({
        where: { id: website.id },
        data: {
          framework: framework || website.framework,
          apiKey,
          status: 'connected',
          updatedAt: new Date()
        }
      });
    }

    // 3. Issue a secure JWT sync token specifically for this website
    const syncToken = jwt.sign(
      { 
        websiteId: website.id, 
        projectId: project.id, 
        domain: website.domain 
      }, 
      JWT_SECRET,
      { expiresIn: '30d' } // token is valid for 30 days
    );

    // Save token to database
    try {
      await prisma.websiteToken.create({
        data: {
          websiteId: website.id,
          token: syncToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isActive: true
        }
      });
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
        console.log('[API Connect] Token already exists, reusing existing.');
      } else {
        throw e;
      }
    }

    // Save sync token to Website record
    await prisma.website.update({
      where: { id: website.id },
      data: { syncToken }
    });

    // 4. Create SyncLog record for audit logs
    await prisma.syncLog.create({
      data: {
        websiteId: website.id,
        action: 'CONNECT',
        status: 'success',
        details: `Successfully registered website: ${domain} (Framework: ${framework}). Issued secure sync token.`
      }
    });

    return NextResponse.json({
      success: true,
      websiteId: website.id,
      syncToken,
      message: 'Website connected and registered successfully.'
    });

  } catch (error) {
    console.error('[API Connect] Connection handshake error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
