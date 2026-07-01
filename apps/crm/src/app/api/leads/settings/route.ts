import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'src/lib/leads-settings.json');

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to read lead settings:', e);
  }
  return {
    notificationEmail: 'ahealthplace@gmail.com',
    autoReplyEnabled: true,
    autoReplySubject: 'Thank you for contacting us',
    autoReplyBody: 'We have received your request and will reach out shortly.',
    spamProtectionEnabled: true,
  };
}

function writeSettings(data: any) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Failed to write lead settings:', e);
    return false;
  }
}

export async function GET() {
  const data = readSettings();
  return NextResponse.json({ settings: data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = readSettings();
    const updated = {
      ...current,
      ...body,
    };
    writeSettings(updated);
    return NextResponse.json({ success: true, settings: updated });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
