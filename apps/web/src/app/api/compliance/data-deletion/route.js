import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Delete associated Leads
    const deletedLeads = await prisma.lead.deleteMany({
      where: { email },
    });

    // 2. Delete associated Form Submissions
    const deletedSubmissions = await prisma.formSubmission.deleteMany({
      where: { email },
    });

    // 3. Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_COMPLIANCE_DATA',
        details: `Compliance data deletion request processed for email: ${email}. Leads deleted: ${deletedLeads.count}, Form Submissions deleted: ${deletedSubmissions.count}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Compliance data deletion completed',
      details: {
        leadsDeleted: deletedLeads.count,
        submissionsDeleted: deletedSubmissions.count,
      },
    });
  } catch (error) {
    console.error('Compliance data deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
