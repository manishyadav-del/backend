import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { encryptText, decryptText } from '@/lib/encryption.js';

export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const website = await prisma.connectedWebsite.findUnique({
      where: { id },
      include: {
        _count: {
          select: { routes: true }
        }
      }
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Decrypt fields
    const decryptedAuthToken = website.authToken ? decryptText(website.authToken) : '';
    const decryptedDbPassword = website.dbPassword ? decryptText(website.dbPassword) : '';

    const sanitizedWebsite = {
      ...website,
      authToken: decryptedAuthToken,
      dbPassword: decryptedDbPassword
    };

    return NextResponse.json({ success: true, data: sanitizedWebsite });
  } catch (error) {
    console.error('Get website error:', error);
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
    const {
      name,
      domain,
      ipAddress,
      apiUrl,
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      authToken,
      framework,
      status,
      environment,
      ownerInfo
    } = body;

    const existing = await prisma.connectedWebsite.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const data = {
      name,
      domain,
      ipAddress,
      apiUrl,
      dbHost,
      dbPort: dbPort ? parseInt(dbPort) : null,
      dbUser,
      framework,
      status,
      environment,
      ownerInfo
    };

    if (dbPassword) {
      data.dbPassword = encryptText(dbPassword);
    }
    if (authToken) {
      data.authToken = encryptText(authToken);
    }

    const updated = await prisma.connectedWebsite.update({
      where: { id },
      data
    });

    await prisma.connectedWebsiteLog.create({
      data: {
        websiteId: id,
        action: 'UPDATE_SETTINGS',
        status: 'success',
        details: 'Connection parameters and credentials updated successfully.'
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update website error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.connectedWebsite.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    await prisma.connectedWebsite.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Website connection removed successfully' });
  } catch (error) {
    console.error('Delete website error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
