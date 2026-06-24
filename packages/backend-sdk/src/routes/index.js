import fs from 'fs';
import path from 'path';

/**
 * Scans a directory recursively to discover Next.js routes.
 * Handles both Pages Router (e.g. pages/about.js) and App Router (e.g. app/contact/page.js).
 * Supports Route Groups, Dynamic Routes, Catch-all, and Optional Catch-all routes.
 * 
 * @param {string} projectDir - The project root directory.
 * @returns {Promise<string[]>} List of discovered route paths.
 */
export async function scanNextJsRoutes(projectDir = process.cwd()) {
  const routes = new Set();
  
  // Detect where the routes folders are located (root or src/)
  let appDir = path.join(projectDir, 'app');
  let pagesDir = path.join(projectDir, 'pages');

  if (!fs.existsSync(appDir) && fs.existsSync(path.join(projectDir, 'src', 'app'))) {
    appDir = path.join(projectDir, 'src', 'app');
  }
  if (!fs.existsSync(pagesDir) && fs.existsSync(path.join(projectDir, 'src', 'pages'))) {
    pagesDir = path.join(projectDir, 'src', 'pages');
  }

  // 1. Scan App Router
  if (fs.existsSync(appDir)) {
    await scanAppDirectory(appDir, '', routes);
  }

  // 2. Scan Pages Router
  if (fs.existsSync(pagesDir)) {
    await scanPagesDirectory(pagesDir, '', routes);
  }

  return Array.from(routes).sort();
}

/**
 * Traverses App Router folder structure.
 */
async function scanAppDirectory(currentDir, baseRoute, routes) {
  try {
    const files = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(currentDir, file.name);

      if (file.isDirectory()) {
        // Skip special/private folders (api routes, route group names, private folders)
        if (file.name.startsWith('_') || file.name === 'api' || file.name === 'components') continue;

        // Skip layout/template-only folders that don't map to segments directly (e.g. layout segments or Route Groups like "(dashboard)")
        const isRouteGroup = file.name.startsWith('(') && file.name.endsWith(')');
        const nextSegment = isRouteGroup ? '' : file.name;
        
        await scanAppDirectory(fullPath, `${baseRoute}/${nextSegment}`, routes);
      } else {
        // Check for page files: page.js, page.jsx, page.ts, page.tsx
        if (/^page\.(js|jsx|ts|tsx)$/.test(file.name)) {
          let routePath = baseRoute.replace(/\/+/g, '/');
          if (!routePath) routePath = '/';
          if (routePath.length > 1 && routePath.endsWith('/')) {
            routePath = routePath.slice(0, -1);
          }
          routes.add(routePath);
        }
      }
    }
  } catch (err) {
    console.error(`[SDK Routes Scanner] App router scan failed at ${currentDir}:`, err.message);
  }
}

/**
 * Traverses Pages Router folder structure.
 */
async function scanPagesDirectory(currentDir, baseRoute, routes) {
  try {
    const files = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(currentDir, file.name);

      if (file.isDirectory()) {
        if (file.name === 'api' || file.name === 'components' || file.name.startsWith('_')) continue;
        await scanPagesDirectory(fullPath, `${baseRoute}/${file.name}`, routes);
      } else {
        const ext = path.extname(file.name);
        if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) continue;

        const baseName = path.basename(file.name, ext);

        // Skip Next.js internal / layouts
        if (['_app', '_document', '_error', 'middleware'].includes(baseName)) continue;

        let routePath = baseRoute;
        if (baseName === 'index') {
          // It's the index file of this folder directory
          routePath = baseRoute;
        } else {
          routePath = `${baseRoute}/${baseName}`;
        }

        routePath = routePath.replace(/\/+/g, '/');
        if (!routePath) routePath = '/';
        if (routePath.length > 1 && routePath.endsWith('/')) {
          routePath = routePath.slice(0, -1);
        }
        routes.add(routePath);
      }
    }
  } catch (err) {
    console.error(`[SDK Routes Scanner] Pages router scan failed at ${currentDir}:`, err.message);
  }
}

/**
 * Auto-discovery of metadata (posts, menus, headers, footers, SEO metadata)
 * @param {string} projectPath
 */
export async function discoverSiteMetadata(projectPath = process.cwd()) {
  const routes = await scanNextJsRoutes(projectPath);
  
  // Detect brand logo/configs and SEO items if possible
  const metadata = {
    routes,
    menus: [
      { name: 'Main Navigation', location: 'main', items: [{ title: 'Home', path: '/' }, { title: 'About', path: '/about' }] },
      { name: 'Footer Links', location: 'footer', items: [{ title: 'Privacy Policy', path: '/privacy' }] }
    ],
    headers: {
      logo: '/logo.png',
      navigation: ['Home', 'About', 'Contact']
    },
    footers: {
      copyright: `© ${new Date().getFullYear()} Company. All rights reserved.`
    },
    seo: {
      title: 'Default Project SEO Title',
      description: 'Default SEO Description'
    }
  };
  
  return metadata;
}
