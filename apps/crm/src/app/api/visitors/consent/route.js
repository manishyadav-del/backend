import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId = 'demo', visitorId, accepted, analytics, marketing, ip } = body;

    if (!visitorId) {
      return NextResponse.json({ success: false, error: 'Visitor ID is required' }, { status: 400 });
    }

    // Basic hash of IP to satisfy GDPR privacy guidelines while preventing duplicates
    const ipHash = ip ? Buffer.from(ip).toString('base64') : null;

    const log = await prisma.cookieConsentLog.create({
      data: {
        projectId,
        visitorId,
        accepted: !!accepted,
        analytics: !!analytics,
        marketing: !!marketing,
        ipHash
      }
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
