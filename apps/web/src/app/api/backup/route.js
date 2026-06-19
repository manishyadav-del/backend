import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const backups = await prisma.backup.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ backups });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { projectId, type } = body;

    if (!projectId) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

    const backupType = type || 'database';

    // 1. Gather all database records associated with the project
    const [
      pages,
      services,
      blogs,
      testimonials,
      faqs,
      contacts,
      leads,
      formSubmissions,
      navigation,
      redirects,
      settings,
      emailSettings
    ] = await Promise.all([
      prisma.page.findMany({ where: { projectId }, include: { seo: true, sections_rel: true } }),
      prisma.service.findMany({ where: { projectId } }),
      prisma.blog.findMany({ where: { projectId } }),
      prisma.testimonial.findMany({ where: { projectId } }),
      prisma.fAQ.findMany({ where: { projectId } }),
      prisma.contact.findMany({ where: { projectId } }),
      prisma.lead.findMany({ where: { projectId } }),
      prisma.formSubmission.findMany({ where: { projectId } }),
      prisma.navigation.findMany({ where: { projectId } }),
      prisma.redirect.findMany({ where: { projectId } }),
      prisma.globalSetting.findUnique({ where: { projectId } }),
      prisma.emailSetting.findUnique({ where: { projectId } }),
    ]);

    const backupData = {
      projectId,
      timestamp: new Date().toISOString(),
      generatedBy: user.email,
      data: {
        pages,
        services,
        blogs,
        testimonials,
        faqs,
        contacts,
        leads,
        formSubmissions,
        navigation,
        redirects,
        settings,
        emailSettings,
      }
    };

    // 2. Save JSON file to disk
    const timestamp = Date.now();
    const filename = `backup_${backupType}_${timestamp}.json`;
    
    const backupDir = path.join(process.cwd(), 'public', 'backups', projectId);
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    const fileContent = JSON.stringify(backupData, null, 2);
    const filePath = path.join(backupDir, filename);
    await fs.writeFile(filePath, fileContent, 'utf-8');

    const fileSize = Buffer.byteLength(fileContent);
    const fileUrl = `/backups/${projectId}/${filename}`;

    // 3. Create backup record
    const backup = await prisma.backup.create({
      data: {
        projectId,
        type: backupType,
        fileUrl,
        size: fileSize,
        status: 'completed',
      },
    });

    return NextResponse.json({ success: true, backup });
  } catch (error) {
    console.error('Backup generation failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}