/**
 * @global-backend/next SDK
 * 
 * Connect any Next.js frontend to the Global Backend dashboard.
 * 
 * Usage:
 *   import { GlobalBackendClient, sync } from '@global-backend/next';
 *   import { DynamicRenderer, SchemaScript, GlobalBackendProvider } from '@global-backend/next/components';
 *   import { usePageContent, useGlobalSettings } from '@global-backend/next/hooks';
 */

export { GlobalBackendClient } from './client.js';
export { scanRoutes, syncPages } from './sync.js';
export { registerProject } from './register.js';
export { createAgentHandler } from './agent.js';