# SDK Guide

The `@global-backend/next` package allows any Next.js application to connect to the Global Backend.

## Installation

```bash
npm install @global-backend/next
```

## Setup

Initialize the client with your Project API Key:

```javascript
import { GlobalBackendClient } from '@global-backend/next';

export const gbClient = new GlobalBackendClient({
  apiKey: process.env.GLOBAL_BACKEND_API_KEY,
  apiUrl: process.env.GLOBAL_BACKEND_URL
});
```

## Syncing Routes

You can create a script or API route to sync your frontend routes with the backend:

```javascript
import { syncPages } from '@global-backend/next';

// Inside a script or Next.js API route
await syncPages(gbClient, './src/app');
```

## Fetching Page Data

```jsx
import { gbClient } from '@/lib/gb-client';
import { DynamicRenderer } from '@global-backend/next/components';

export default async function DynamicPage({ params }) {
  const { slug } = params;
  const { page } = await gbClient.getPage(slug.join('/'));

  return (
    <main>
      <h1>{page.title}</h1>
      <DynamicRenderer blocks={page.contentBlocks} />
    </main>
  );
}
```
