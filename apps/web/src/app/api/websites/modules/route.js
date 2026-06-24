import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

const STANDARD_MODULES = [
  { key: 'dashboard', name: 'Dashboard', description: 'Centralized telemetry, metrics, and widgets.' },
  { key: 'content', name: 'Content Management', description: 'Edit page sections, banners, images, and forms.' },
  { key: 'crm', name: 'Marketing & Leads', description: 'Manage form submissions, popups, CTAs, and leads.' },
  { key: 'analytics', name: 'Analytics', description: 'Monitor page durations, visitor sessions, and device shares.' },
  { key: 'builder', name: 'Website Builder', description: 'Manage navigation, header configurations, and template themes.' },
  { key: 'reputation', name: 'Reputation & Content', description: 'Manage testimonials, FAQs, and public reviews.' },
  { key: 'seo', name: 'SEO & Performance', description: 'Configure meta titles, tags, robots.txt, and canonicals.' },
  { key: 'security', name: 'Security & Compliance', description: 'Role-Based Access Control, cookie consents, and whitelists.' },
  { key: 'users', name: 'User Management', description: 'Configure system administrators, authors, and contributors.' },
  { key: 'system', name: 'System', description: 'Manage database backups, SMTP details, and auto-sync jobs.' },
  { key: 'legal', name: 'Legal', description: 'Terms of service, privacy policy, and cookie notices.' }
];

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure standard modules exist in the database
    for (const mod of STANDARD_MODULES) {
      await prisma.connectedWebsiteModule.upsert({
        where: { key: mod.key },
        update: {},
        create: {
          key: mod.key,
          name: mod.name,
          description: mod.description,
          status: 'active'
        }
      });
    }

    const modules = await prisma.connectedWebsiteModule.findMany({
      orderBy: { key: 'asc' }
    });

    return NextResponse.json({ success: true, data: modules });
  } catch (error) {
    console.error('List website modules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
