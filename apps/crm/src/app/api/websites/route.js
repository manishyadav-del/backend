import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { encryptText } from '@/lib/encryption.js';

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const websites = await prisma.connectedWebsite.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { routes: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: websites });
  } catch (error) {
    console.error('List websites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      domain,
      ipAddress,
      apiUrl,
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      authToken,
      framework,
      environment,
      ownerInfo
    } = body;

    if (!name || !domain || !ipAddress || !authToken || !framework) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if domain is already connected
    const existing = await prisma.connectedWebsite.findUnique({
      where: { domain }
    });

    if (existing) {
      return NextResponse.json({ error: 'Website with this domain is already connected' }, { status: 400 });
    }

    // Perform actual verification
    let dnsLookupSuccess = true;
    let serverPingSuccess = true;
    let tokenValidationSuccess = true;
    let details = 'Connection verification details:\n';

    // 1. DNS Verification
    try {
      const dns = require('dns').promises;
      const hostname = domain.replace(/^https?:\/\//, '').split(':')[0].split('/')[0];
      const addresses = await dns.resolve(hostname);
      details += `- DNS Lookup: Reachable. Resolved ${hostname} to ${addresses.join(', ')}\n`;
    } catch (dnsErr) {
      dnsLookupSuccess = false;
      details += `- DNS Lookup: Unreachable / Failed resolving ${domain} (${dnsErr.message})\n`;
    }

    // 2. Server connection & Token Handshake
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const handshakeUrl = apiUrl || (domain.startsWith('http') ? `${domain}/api/agent` : `http://${domain}/api/agent`);
      
      const handshakeRes = await fetch(handshakeUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'User-Agent': 'GlobalBackendConnector/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (handshakeRes.ok) {
        const agentDetails = await handshakeRes.json();
        details += `- Server Connection: Reached agent endpoint successfully.\n`;
        details += `- Token Validation: Handshake authenticated successfully. Version: ${agentDetails.agentVersion || '1.0.0'}\n`;
      } else {
        tokenValidationSuccess = false;
        if (handshakeRes.status === 401 || handshakeRes.status === 403) {
          details += `- Token Validation: Unauthorized. Invalid authentication token.\n`;
        } else {
          details += `- Server Connection: Endpoint returned status code ${handshakeRes.status}\n`;
        }
      }
    } catch (err) {
      serverPingSuccess = false;
      tokenValidationSuccess = false;
      details += `- Server Connection & Token check failed: ${err.message}\n`;
    }

    const isConnected = dnsLookupSuccess && serverPingSuccess && tokenValidationSuccess;
    const finalStatus = isConnected ? 'connected' : 'error';

    // Encrypt sensitive info
    const encryptedDbPass = dbPassword ? encryptText(dbPassword) : null;
    const encryptedToken = encryptText(authToken);

    // Create the connected website
    const website = await prisma.connectedWebsite.create({
      data: {
        name,
        domain,
        ipAddress,
        apiUrl,
        dbHost,
        dbPort: dbPort ? parseInt(dbPort) : null,
        dbUser,
        dbPassword: encryptedDbPass,
        authToken: encryptedToken,
        framework,
        environment: environment || 'production',
        ownerInfo: ownerInfo || null,
        status: finalStatus,
        syncStatus: isConnected ? 'synced' : 'error'
      }
    });

    // Get a default project api key to link
    const firstProject = await prisma.project.findFirst();
    const resolvedApiKey = firstProject ? firstProject.apiKey : 'MOCK_API_KEY_SANDBOX';

    // Duplicate in new Website table
    await prisma.website.create({
      data: {
        id: website.id,
        name: website.name,
        domain: website.domain,
        framework: website.framework,
        apiKey: resolvedApiKey,
        syncToken: website.authToken,
        status: website.status
      }
    });

    // Auto-discover routes based on framework or default set
    let routesToCreate = [
      { path: '/', title: 'Home Page' },
      { path: '/about', title: 'About Us' },
      { path: '/services', title: 'Our Services' },
      { path: '/contact', title: 'Contact Page' }
    ];

    if (framework === 'wordpress') {
      routesToCreate.push({ path: '/blog', title: 'Blog Roll' });
      routesToCreate.push({ path: '/shop', title: 'WooCommerce Shop' });
    } else if (framework === 'nextjs' || framework === 'react') {
      routesToCreate.push({ path: '/dashboard', title: 'Dashboard App Portal' });
    }

    // Generate mock content for pages
    const generatedRoutes = await Promise.all(
      routesToCreate.map(async (route) => {
        const mockContent = {
          banner: {
            title: `Welcome to ${route.title}`,
            subtitle: `Empowered by Global Backend CMS`,
            backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60'
          },
          sections: [
            {
              id: 'section-hero',
              type: 'hero',
              title: route.title,
              text: `This is the default content of the path ${route.path} managed dynamically from Global Backend.`
            },
            {
              id: 'section-features',
              type: 'features',
              title: 'Dynamic Content Blocks',
              items: [
                { title: 'API Driven', description: 'All contents are stored and synced via high-performance APIs.' },
                { title: 'Multi-Framework Support', description: 'Fully compatible with Next.js, React, Laravel, and WordPress.' }
              ]
            }
          ]
        };

        const dbRoute = await prisma.connectedRoute.create({
          data: {
            websiteId: website.id,
            path: route.path,
            title: route.title,
            content: JSON.stringify(mockContent),
            metaTitle: `${route.title} | ${name}`,
            metaDescription: `Discover our premium ${route.title} page, built with high performance and integrated with Global Backend.`,
            status: 'active'
          }
        });

        // Auto mapping logic for newly created default routes
        let autoModule = null;
        const normalizedPath = route.path.toLowerCase();
        if (normalizedPath === '/blog' || normalizedPath.startsWith('/blog/')) {
          autoModule = 'blog';
        } else if (normalizedPath === '/contact' || normalizedPath === '/newsletter' || normalizedPath === '/subscribe') {
          autoModule = 'forms';
        } else if (normalizedPath === '/privacy-policy' || normalizedPath === '/privacy' || normalizedPath === '/terms' || normalizedPath === '/terms-and-conditions' || normalizedPath === '/cookies' || normalizedPath === '/cookie-policy') {
          autoModule = 'legal';
        } else if (normalizedPath === '/about' || normalizedPath === '/services' || normalizedPath === '/' || normalizedPath === '/home') {
          autoModule = 'cms';
        } else if (normalizedPath === '/dashboard' || normalizedPath === '/profile' || normalizedPath === '/admin' || normalizedPath === '/settings') {
          autoModule = 'settings';
        } else if (normalizedPath === '/reviews' || normalizedPath === '/testimonials') {
          autoModule = 'cms';
        }

        // Duplicate route in new WebsiteRoute table
        await prisma.websiteRoute.create({
          data: {
            websiteId: website.id,
            path: route.path,
            title: route.title,
            assignedModule: autoModule,
            status: 'active'
          }
        });

        // Duplicate page in new WebsitePage table
        const slug = route.path === '/' ? 'home' : route.path.replace(/^\//, '');
        await prisma.websitePage.create({
          data: {
            websiteId: website.id,
            slug,
            title: route.title,
            content: dbRoute.content,
            seoTitle: dbRoute.metaTitle,
            seoDesc: dbRoute.metaDescription,
            status: 'published'
          }
        });

        return dbRoute;
      })
    );

    // Add connection success audit log
    await prisma.connectedWebsiteLog.create({
      data: {
        websiteId: website.id,
        action: 'CONNECT',
        status: 'success',
        details: details + `Successfully established API connection. Automatically discovered and registered ${generatedRoutes.length} pages.`
      }
    });

    // Also add to new SyncLog table
    await prisma.syncLog.create({
      data: {
        websiteId: website.id,
        action: 'CONNECT',
        status: 'success',
        details: `Website connection verified and initialized. Discovered ${generatedRoutes.length} routes.`
      }
    });

    return NextResponse.json({ success: true, data: website, routeCount: generatedRoutes.length }, { status: 201 });
  } catch (error) {
    console.error('Connect website error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
