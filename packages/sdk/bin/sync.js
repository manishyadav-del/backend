#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { GlobalBackendClient } from '../src/client.js';
import { syncPages } from '../src/sync.js';

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--app-dir' || arg === '-d') {
      args.appDir = process.argv[++i];
    } else if (arg === '--api-key' || arg === '-k') {
      args.apiKey = process.argv[++i];
    } else if (arg === '--backend-url' || arg === '-u') {
      args.backendUrl = process.argv[++i];
    }
  }
  return args;
}

async function run() {
  console.log('\x1b[35m%s\x1b[0m', '🌐 Global Backend — Next.js Route Sync Tool');
  
  const args = parseArgs();
  
  const apiKey = args.apiKey || process.env.GLOBAL_BACKEND_API_KEY;
  const backendUrl = args.backendUrl || process.env.GLOBAL_BACKEND_URL || 'http://localhost:3000';
  
  let appDir = args.appDir;
  if (!appDir) {
    if (fs.existsSync(path.resolve('./app'))) {
      appDir = './app';
    } else if (fs.existsSync(path.resolve('./src/app'))) {
      appDir = './src/app';
    } else {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error: Could not find Next.js app directory automatically.');
      console.log('Please specify it manually using: --app-dir <path> or -d <path>');
      process.exit(1);
    }
  }

  if (!apiKey) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error: API Key is required.');
    console.log('Provide it via: --api-key <key> (-k <key>) or env variable GLOBAL_BACKEND_API_KEY');
    process.exit(1);
  }

  const resolvedAppDir = path.resolve(appDir);
  console.log(`Scanning routes in: \x1b[36m${resolvedAppDir}\x1b[0m`);
  console.log(`Connecting to backend: \x1b[36m${backendUrl}\x1b[0m`);

  try {
    const client = new GlobalBackendClient({
      apiKey,
      apiUrl: backendUrl
    });

    const result = await syncPages(client, resolvedAppDir);
    
    console.log('\x1b[32m%s\x1b[0m', `✅ Success: Synced ${result.syncedCount || 0} routes successfully at ${result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}!`);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Sync failed:', error.message);
    process.exit(1);
  }
}

run();
