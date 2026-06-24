# @global/backend-sdk

The `@global/backend-sdk` is an installable JavaScript SDK that connects external web applications directly with the Global Backend CMS. It enables automated route discovery, pages and sections updates, media synchronization, and real-time Socket.io-driven layout modifications.

## Installation

Install the package via npm:

```bash
npm install @global/backend-sdk
```

## Setup & Initialization

Import and initialize the client in your main server startup script or config file:

```javascript
import { GlobalBackendSDK } from "@global/backend-sdk";

const sdk = new GlobalBackendSDK({
  backendUrl: "http://localhost:3000", // Your Global Backend Platform URL
  apiKey: "YOUR_PROJECT_API_KEY",
  websiteId: "YOUR_WEBSITE_ID",
  domain: "yourwebsite.com"
});

// Starts socket listeners, performs route auto-discovery, and synchronizes status
sdk.initialize();
```

## Next.js Website Connector Middleware

To automatically handle incoming push updates from the dashboard (such as page revisions or layout edits), mount the connector API route. 

In Next.js App Router, create `app/api/global/[...route]/route.js`:

```javascript
import { createConnector } from "@global/backend-sdk";

const connector = createConnector();

export { 
  connector as GET, 
  connector as POST, 
  connector as PUT, 
  connector as DELETE 
};
```

In Next.js Pages Router, create `pages/api/global.js`:

```javascript
import { createConnector } from "@global/backend-sdk";

export default createConnector();
```

The middleware automatically:
1. Validates incoming synchronization tokens.
2. Registers custom handlers or triggers callbacks to save updated content.
3. Responds back to the Global Backend platform to confirm successful synchronization.

## Listeners and Callbacks

You can listen to specific synchronization hooks to write the synced pages and routes to your own storage (database, cache, or files):

```javascript
sdk.on("route:sync", (routes) => {
  console.log("Synchronized routes:", routes);
});

sdk.on("page:sync", (page) => {
  console.log("Page updated:", page);
});

sdk.on("module:sync", (modules) => {
  console.log("Modules config changed:", modules);
});
```
