import { GlobalBackendClient } from '@global/global-backend-next/dist/client.js';

// Only run SDK registration on the client side
if (typeof window !== 'undefined') {
  // Dynamically import client-only SDK parts to avoid SSR issues
  import('@global/global-backend-next/dist/client.js').then(({ registerPage }) => {
    // Register frontend pages to auto-sync with the backend registry
    registerPage({ name: 'Home', route: '/', layout: 'landing' });
    registerPage({ name: 'About Us', route: '/about-us', layout: 'default' });
    registerPage({ name: 'Contact', route: '/contact', layout: 'default' });
    registerPage({ name: 'Blogs', route: '/blogs', layout: 'sidebar' });
    registerPage({ name: 'Blog Post', route: '/[slug]', layout: 'default' });
    registerPage({ name: 'Privacy Policy', route: '/privacy-policy', layout: 'full-width' });
    registerPage({ name: 'Terms & Conditions', route: '/terms-and-conditions', layout: 'full-width' });
    registerPage({ name: 'Services', route: '/services', layout: 'default' });
  }).catch(() => {
    // SDK not available, silently skip
  });
}

export const globalBackendClient = new GlobalBackendClient({
  apiKey: process.env.GLOBAL_BACKEND_API_KEY || process.env.NEXT_PUBLIC_GLOBAL_BACKEND_API_KEY || 'gbl_api_key_main_2024_v2',
  apiUrl: process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL || 'http://localhost:3000',
});

// Run this on startup on the server side (instrumentation.js)
export async function initSDK() {
  const { GlobalBackendSDK } = await import('@global/global-backend-next/dist/client.js');
  const sdk = new GlobalBackendSDK({
    apiKey: process.env.GLOBAL_BACKEND_API_KEY || process.env.NEXT_PUBLIC_GLOBAL_BACKEND_API_KEY || 'gbl_api_key_main_2024_v2',
    websiteId: process.env.GLOBAL_BACKEND_WEBSITE_ID || 'ahealthplace_website_id_123',
    backendUrl: process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL || 'http://localhost:3000',
    domain: process.env.GLOBAL_BACKEND_DOMAIN || process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3001',
    debug: process.env.NODE_ENV === 'development'
  });
  
  await sdk.initialize().catch((err: Error) => {
    console.error('Failed to initialize Global Backend SDK on server:', err);
  });
}
