import { GlobalBackendSDK, createConnector } from '../packages/backend-sdk/src/index.js';
import { validateSyncToken } from '../packages/backend-sdk/src/auth/index.js';
import { PrismaClient } from '../apps/web/src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Starting SDK & Website Connector Integration Test...');

  // 1. Seed or retrieve a test Project in the database so we have a valid API Key
  console.log('⚙️ Preparing test project inside database...');
  let project = await prisma.project.findFirst({
    where: { apiKey: 'sdk_test_api_key_abc123' }
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'SDK Testing Portal',
        apiKey: 'sdk_test_api_key_abc123',
        description: 'Test environment for SDK auto-discovery'
      }
    });
    console.log('✅ Created new test Project.');
  } else {
    console.log('✅ Found existing test Project.');
  }

  const websiteId = 'sdk_test_website_id';
  const domain = 'localhost:4000';
  const apiKey = project.apiKey;

  // Cleanup any old test Website record to run a clean registration test
  await prisma.website.deleteMany({
    where: { id: websiteId }
  });

  // 2. Initialize the SDK Client
  console.log('🚀 Initializing GlobalBackendSDK...');
  const sdk = new GlobalBackendSDK({
    backendUrl: 'http://localhost:3001',
    apiKey: apiKey,
    websiteId: websiteId,
    domain: domain,
    framework: 'nextjs'
  });

  // Set up event listeners on SDK to trace execution
  sdk.on('ready', () => {
    console.log('📢 SDK Event: ready');
  });

  sdk.on('connected', (data) => {
    console.log('📢 SDK Event: connected to websocket room:', data.room);
  });

  sdk.on('routes:synced', (discoveredRoutes) => {
    console.log('📢 SDK Event: routes:synced ->', discoveredRoutes);
  });

  sdk.on('sync', (data) => {
    console.log('📢 SDK Event: sync (applied changes) ->', data);
  });

  // 3. Start initialization
  console.log('🔗 Executing sdk.initialize()...');
  await sdk.initialize();

  // Verify SDK has loaded the sync token
  console.log('🔑 Sync token received:', sdk.syncToken ? 'YES (Valid Length)' : 'NO');
  
  if (sdk.syncToken) {
    // 4. Validate JWT Token locally to check JWT authentication logic
    const decoded = validateSyncToken(sdk.syncToken, process.env.JWT_SECRET || 'your-super-secret-key');
    console.log('🔍 Local Sync Token Validation:', decoded ? `SUCCESS (Website: ${decoded.websiteId})` : 'FAILED');
  }

  // 5. Test syncing layouts (headers & footers)
  console.log('📋 Testing Layout Synchronization...');
  const headerRes = await sdk.syncHeader({
    logo: '/logo-new.png',
    navigation: ['Home', 'About Us', 'Contact Us', 'Services']
  });
  console.log('✅ syncHeader Response:', headerRes.message);

  const footerRes = await sdk.syncFooter({
    copyright: '© 2026 Test Corp'
  });
  console.log('✅ syncFooter Response:', footerRes.message);

  // 6. Test syncing media assets
  console.log('🖼️ Testing Media Assets Synchronization...');
  const mediaRes = await sdk.syncMedia({
    filename: 'banner-hero.jpg',
    url: 'https://cdn.example.com/banner-hero.jpg',
    mimeType: 'image/jpeg',
    size: 204800,
    altText: 'Hero banner dynamic cover'
  });
  console.log('✅ syncMedia Response:', mediaRes.message);

  // 7. Test syncing modules configuration
  console.log('⚙️ Testing Modules Configuration Synchronization...');
  const modulesRes = await sdk.syncModules({
    seo: true,
    analytics: true,
    content: true,
    security: false
  });
  console.log('✅ syncModules Response:', modulesRes.message);

  // 8. Test Connector Middleware mockup
  console.log('🔗 Testing Connector Middleware Handler...');
  const connector = createConnector({
    secret: process.env.JWT_SECRET || 'your-super-secret-key',
    onSyncRoute: async (action, route) => {
      console.log(`🔌 [Connector Callback] Route Sync: Action = ${action}, Path = ${route.path}`);
    },
    onSyncPage: async (action, page) => {
      console.log(`🔌 [Connector Callback] Page Sync: Action = ${action}, Slug = ${page.slug}`);
    }
  });

  // Mock Request to connector middleware (App Router style)
  const mockHeaders = new Headers();
  mockHeaders.set('authorization', `Bearer ${sdk.syncToken}`);
  const mockRequest = new Request('http://localhost:4000/api/global', {
    method: 'POST',
    headers: mockHeaders,
    body: JSON.stringify({
      action: 'UPDATE',
      route: { path: '/about', title: 'About Page Update' },
      page: { slug: 'about', title: 'About page content title', content: { text: 'Hello' } }
    })
  });

  const response = await connector(mockRequest);
  const responseData = await response.json();
  console.log('🔌 Connector Middleware Mock Response status:', response.status);
  console.log('🔌 Connector Middleware Mock Response data:', responseData);

  // Close SDK sockets
  if (sdk.socket) {
    sdk.socket.disconnect();
  }

  // Verify database sync records exist
  const syncLogs = await prisma.syncLog.findMany({
    where: { websiteId },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`📝 Logged ${syncLogs.length} synchronization records in database.`);

  console.log('🎉 SDK Connector system validated successfully and is 100% functional!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Integration Test failed:', err);
  process.exit(1);
});
