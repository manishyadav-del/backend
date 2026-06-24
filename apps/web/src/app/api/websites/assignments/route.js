import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleKey = searchParams.get('moduleKey');

    if (!moduleKey) {
      return NextResponse.json({ error: 'moduleKey is required' }, { status: 400 });
    }

    // Get module ID
    const moduleItem = await prisma.connectedWebsiteModule.findUnique({
      where: { key: moduleKey }
    });

    if (!moduleItem) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Get websites and their assignment
    const websites = await prisma.connectedWebsite.findMany({
      orderBy: { name: 'asc' },
      include: {
        moduleAssignments: {
          where: { moduleId: moduleItem.id }
        }
      }
    });

    const formatted = websites.map(site => {
      const assignment = site.moduleAssignments[0] || null;
      return {
        id: site.id,
        name: site.name,
        domain: site.domain,
        assigned: assignment ? assignment.status === 'enabled' : false,
        lastSyncedAt: assignment?.lastSyncedAt || null,
        syncStatus: assignment?.syncStatus || 'pending'
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Get module assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleKey, websiteIds, status = 'enabled' } = body;

    if (!moduleKey || !Array.isArray(websiteIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const moduleItem = await prisma.connectedWebsiteModule.findUnique({
      where: { key: moduleKey }
    });

    if (!moduleItem) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const assignments = await Promise.all(
      websiteIds.map(async (websiteId) => {
        return prisma.moduleAssignment.upsert({
          where: {
            websiteId_moduleId: {
              websiteId,
              moduleId: moduleItem.id
            }
          },
          update: {
            status
          },
          create: {
            websiteId,
            moduleId: moduleItem.id,
            status,
            syncStatus: 'pending'
          }
        });
      })
    );

    // Storing logs
    for (const websiteId of websiteIds) {
      await prisma.connectedWebsiteLog.create({
        data: {
          websiteId,
          action: 'ASSIGN_MODULE',
          status: 'success',
          details: `Module assignment updated: ${moduleKey} has been set to status "${status}"`
        }
      });
    }

    return NextResponse.json({ success: true, count: assignments.length });
  } catch (error) {
    console.error('Update module assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
