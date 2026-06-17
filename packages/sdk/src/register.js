import path from 'path';
import { syncPages } from './sync.js';

export async function registerProject(client) {
  const appDir = path.join(process.cwd(), 'app');

  try {
    const result = await syncPages(client, appDir);

    console.log(
      `✅ Global Backend Sync Complete (${result.syncedCount} pages)`
    );

    return result;
  } catch (error) {
    console.error('❌ Global Backend Sync Failed');
    console.error(error);
  }
}