import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing Authorization Header' }, { status: 401 });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Token' }, { status: 401 });
    }

    const body = await request.json();
    const { websiteId, modules } = body;

    if (!websiteId || !modules) {
      return NextResponse.json({ success: false, error: 'Missing websiteId or modules configuration' }, { status: 400 });
    }

    if (decoded.websiteId !== websiteId) {
      return NextResponse.json({ success: false, error: 'Forbidden: Website ID mismatch' }, { status: 403 });
    }

    const website = await prisma.website.findUnique({
      where: { id: websiteId }
    });

    if (!website) {
      return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
    }

    // modules can be an array of { key, status, config } or a plain key-value object
    let syncResult = [];
    
    if (Array.isArray(modules)) {
      syncResult = await Promise.all(
        modules.map(async (mod) => {
          const modObj = typeof mod === 'string' ? { key: mod } : mod;
          const { key, status, config } = modObj;

          if (!key) {
            console.warn('[API Modules Sync] Skipping invalid module:', mod);
            return null;
          }

          return prisma.websiteModule.upsert({
            where: {
              websiteId_key: { websiteId, key }
            },
            update: {
              status: status || 'enabled',
              config: config ? (typeof config === 'object' ? JSON.stringify(config) : config) : undefined,
              updatedAt: new Date()
            },
            create: {
              websiteId,
              key,
              status: status || 'enabled',
              config: config ? (typeof config === 'object' ? JSON.stringify(config) : config) : null
            }
          });
        })
      );
      syncResult = syncResult.filter(Boolean);
    } else if (typeof modules === 'object') {
      const keys = Object.keys(modules);
      syncResult = await Promise.all(
        keys.map(async (key) => {
          const val = modules[key];
          const status = (val === true || val === 'enabled') ? 'enabled' : 'disabled';
          return prisma.websiteModule.upsert({
            where: {
              websiteId_key: { websiteId, key }
            },
            update: {
              status,
              updatedAt: new Date()
            },
            create: {
              websiteId,
              key,
              status
            }
          });
        })
      );
    }

    await prisma.syncLog.create({
      data: {
        websiteId,
        action: 'SYNC_MODULES',
        status: 'success',
        details: `Synchronized modules status: ${JSON.stringify(modules)}`
      }
    });

    return NextResponse.json({
      success: true,
      modules: syncResult,
      message: 'Modules synchronized successfully.'
    });

  } catch (error) {
    console.error('[API Modules Sync] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
