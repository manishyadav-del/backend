import fs from 'fs';
import path from 'path';

/**
 * Recursively scans the Next.js app directory for route files (page.tsx, page.jsx)
 * @param {string} dir 
 * @param {string} basePath 
 * @returns {Array<{slug: string, isDynamic: boolean}>}
 */
export function scanRoutes(dir, basePath = '') {
  let results = [];
  
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat && stat.isDirectory()) {
      // ignore layout/group directories in path like (auth)
      const folderName = file.startsWith('(') && file.endsWith(')') ? '' : file;
      const newBasePath = path.join(basePath, folderName);
      results = results.concat(scanRoutes(fullPath, newBasePath));
    } else if (file === 'page.tsx' || file === 'page.jsx' || file === 'page.js') {
      let slug = basePath.replace(/\\/g, '/'); // normalize slashes
      if (!slug.startsWith('/')) slug = '/' + slug;
      if (slug.endsWith('/') && slug.length > 1) slug = slug.slice(0, -1);
      
      const isDynamic = slug.includes('[') && slug.includes(']');
      
      results.push({ slug, isDynamic });
    }
  }
  
  return results;
}

/**
 * Sends the discovered routes to the Global Backend API
 */
export async function syncPages(client, appDir) {
  const routes = scanRoutes(appDir);
  
  // Deduplicate in case of nested route groups mapping to same path
  const uniqueRoutes = [];
  const map = new Map();
  for (const r of routes) {
    if (!map.has(r.slug)) {
      map.set(r.slug, true);
      uniqueRoutes.push(r);
    }
  }

  return client.fetch('/sync/pages', {
    method: 'POST',
    body: JSON.stringify({ routes: uniqueRoutes })
  });
}
