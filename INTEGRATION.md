# Global Backend SDK — Integration Guide

## Install

```bash
npm install @global/global-backend-next
# or
yarn add @global/global-backend-next
```

Set environment variables in your `.env.local`:

```env
NEXT_PUBLIC_GLOBAL_BACKEND_URL=http://localhost:3000   # Your Global Backend dashboard URL
GLOBAL_BACKEND_API_KEY=gbl_api_key_your_project_key    # From Project Settings in dashboard
```

---

## Quick Setup (Next.js App Router)

### 1. Create `src/lib/global-backend.ts`

```typescript
import { GlobalBackendClient } from '@global/global-backend-next';

export const client = new GlobalBackendClient({
  apiKey: process.env.GLOBAL_BACKEND_API_KEY!,
  apiUrl: process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL,
});
```

### 2. Create the Agent Route `src/app/api/agent/route.ts`

This is the **handshake endpoint** Global Backend calls to verify your site.

```typescript
import { createAgentHandler } from '@global/global-backend-next';

const handler = createAgentHandler({
  authToken: process.env.GLOBAL_BACKEND_API_KEY!,
  framework: 'nextjs',
  environment: process.env.NODE_ENV as any,
  onRouteSync: async (data) => {
    console.log('[GlobalBackend] Route sync received:', data);
  },
  onContentSync: async (data) => {
    console.log('[GlobalBackend] Content sync received:', data);
  },
});

export { handler as GET, handler as POST };
```

### 3. Create `src/instrumentation.ts`

This auto-runs on server startup and registers your site with the dashboard.

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const path = require('path');
    const { GlobalBackendClient } = await import('@global/global-backend-next');

    const client = new GlobalBackendClient({
      apiKey: process.env.GLOBAL_BACKEND_API_KEY!,
      apiUrl: process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL,
    });

    try {
      const result = await client.connectAndSync({
        name: 'My Next.js App',
        domain: process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3001',
        framework: 'nextjs',
        frameworkVersion: '15',
        sdkVersion: '1.4.0',
        appDir: path.join(process.cwd(), 'src/app'),
        pagesDir: path.join(process.cwd(), 'src/pages'),
        debug: process.env.NODE_ENV === 'development',
      });

      console.log(`[GlobalBackend] ✅ Connected: ${result.routeCount} routes synced`);
    } catch (err) {
      console.warn('[GlobalBackend] Connection failed (non-critical):', err);
    }
  }
}
```

---

## Real-Time Content (Client Components)

### Use `usePageContent` hook

```tsx
'use client';
import { usePageContent } from '@global/global-backend-next';
import { client } from '@/lib/global-backend';

export default function HeroSection() {
  const { page, loading } = usePageContent(client, 'home');

  if (loading) return <div>Loading...</div>;

  return (
    <section>
      <h1>{page?.title}</h1>
      <p>{page?.seo?.metaDescription}</p>
    </section>
  );
}
```

### Use `useGlobalSettings` hook

```tsx
'use client';
import { useGlobalSettings } from '@global/global-backend-next';
import { client } from '@/lib/global-backend';

export default function SiteHeader() {
  const { settings } = useGlobalSettings(client);

  return (
    <header>
      <img src={settings?.brand?.logo} alt={settings?.brand?.name} />
    </header>
  );
}
```

---

## SyncManager (Advanced)

```typescript
import { SyncManager } from '@global/global-backend-next';

const sync = new SyncManager({
  backendUrl: 'http://localhost:3000',
  websiteId: 'your_website_id',
  syncToken: 'your_jwt_sync_token',
  debug: true,
});

await sync.connect();

sync.on('route:update', (data) => {
  console.log('Route updated from dashboard:', data);
  // Revalidate your routes here
});

sync.on('content:update', (data) => {
  console.log('Content updated:', data.slug, data.content);
  // Update your local content state
});

// Clean up on shutdown
process.on('SIGTERM', () => sync.destroy());
```

---

## How It Works

```
Your Frontend App          Global Backend Dashboard
─────────────────          ────────────────────────
 SDK installed
        │
        ▼
 instrumentation.ts  ──POST /api/websites/connect──►  Register website
                     ◄── JWT syncToken ──────────────  Issue token
        │
        ▼
 Scan routes          ──POST /api/routes/sync ───────►  Save routes to DB
        │                                               Show in /dashboard/routes
        ▼
 WebSocket connect    ◄── route:update event ─────────  Admin edits route SEO
 Updates page SEO                                        in dashboard
        │
        ▼
 content:update       ◄── content:update event ──────  Admin edits page content
 Updates DOM live                                        in dashboard
```

---

## API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/websites/connect` | POST | API Key | Register website, receive JWT sync token |
| `/api/routes/sync` | POST | JWT Bearer | Sync discovered routes |
| `/api/routes/:websiteId` | GET | Cookie | Fetch all routes for a website |
| `/api/routes/:id` | PUT | Cookie | Update route SEO metadata |
| `/api/content/update` | POST | Cookie | Push content block update |
| `/api/websites/:id/sync` | POST | Cookie | Trigger manual re-sync |

## WebSocket Events

| Event | Direction | Payload |
|---|---|---|
| `route:update` | Dashboard → Frontend | `{ id, path, title, metaTitle, metaDescription, status }` |
| `content:update` | Dashboard → Frontend | `{ slug, path, content, type }` |
| `website:sync` | Backend → Dashboard | `{ websiteId, type, routeCount, timestamp }` |
| `sync:event` | Backend → Monitor | All sync events for the Live Monitor |

---

## Supported Frameworks

| Framework | Status | Notes |
|---|---|---|
| Next.js (App Router) | ✅ Full | Auto route scan, instrumentation, hooks |
| Next.js (Pages Router) | ✅ Full | scanPagesRouter support |
| React / Vite | 🔶 Partial | Manual `connectAndSync()`, no auto scan |
| Vue | 🔶 Planned | REST API + polling |
| Laravel | 🔶 Planned | REST API only |
| WordPress | 🔶 Partial | REST API via WP agent |
