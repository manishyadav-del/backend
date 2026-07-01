import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'backup_config.json');

async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      autoBackupEnabled: false,
      schedule: 'daily',
      keepLast: 5,
    };
  }
}

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const config = await readConfig();
  return NextResponse.json(config);
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { autoBackupEnabled, schedule, keepLast } = body;

    const newConfig = {
      autoBackupEnabled: !!autoBackupEnabled,
      schedule: schedule || 'daily',
      keepLast: parseInt(keepLast) || 5,
    };

    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
    return NextResponse.json({ success: true, config: newConfig });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config: ' + error.message }, { status: 500 });
  }
}
