import { Page, SEO, Settings, ProjectRoute } from './types.js';
import { GlobalBackendSDK as BaseSDK } from '@global/backend-sdk';
import { SyncManager } from './sync-manager.js';

export class GlobalBackendSDK extends BaseSDK {
  constructor(config: {
    apiKey: string;
    websiteId: string;
    backendUrl?: string;
    domain?: string;
    apiUrl?: string;
    framework?: string;
    debug?: boolean;
  }) {
    super(config);
  }
}

export class GlobalBackendClient {
  private apiKey: string;
  private apiUrl: string;
  public syncManager: SyncManager | null = null;

  constructor(config: { apiKey: string; apiUrl?: string }) {
    if (!config.apiKey) {
      throw new Error('GlobalBackendClient: apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GLOBAL_BACKEND_URL) || 'http://localhost:3000';
  }

  async fetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiUrl}/api${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed: ${response.statusText}`);
    }

    return data;
  }

  async getSettings(): Promise<Settings> {
    const data = await this.fetch('/global-settings?apiKey=' + encodeURIComponent(this.apiKey));
    return data.data || data.settings || data;
  }

  async getPage(slug: string): Promise<Page> {
    const encoded = encodeURIComponent(slug);
    const data = await this.fetch(`/pages/by-slug/${encoded}`);
    return data.page || data.data || data;
  }

  async getSEO(slug: string): Promise<SEO> {
    const encoded = encodeURIComponent(slug);
    const data = await this.fetch(`/seo/by-slug/${encoded}`);
    return data.seo || data.data || data;
  }

  /**
   * connectAndSync: One-call setup for frontend apps.
   * 1. Registers the website with Global Backend
   * 2. Scans all routes (App Router + Pages Router + API routes)
   * 3. Syncs discovered routes to the backend
   * 4. Sets up real-time WebSocket sync manager
   */
  async connectAndSync(options: {
    name?: string;
    domain?: string;
    framework?: string;
    frameworkVersion?: string;
    environment?: string;
    sdkVersion?: string;
    appDir?: string; // Path to app/ or src/app/ for route scanning (server only)
    pagesDir?: string; // Path to pages/ for Pages Router scanning (server only)
    debug?: boolean;
  } = {}): Promise<{
    websiteId: string;
    syncToken: string;
    routeCount: number;
    syncManager: SyncManager;
  }> {
    const isServer = typeof window === 'undefined';

    // 1. Connect / register website
    const connectRes = await this.fetch<{
      success: boolean;
      websiteId: string;
      syncToken: string;
    }>('/websites/connect', {
      method: 'POST',
      body: JSON.stringify({
        apiKey: this.apiKey,
        name: options.name,
        domain: options.domain || (isServer ? (process.env.NEXT_PUBLIC_SITE_URL || 'localhost') : window.location.hostname),
        framework: options.framework || 'nextjs',
        frameworkVersion: options.frameworkVersion,
        environment: options.environment || process.env.NODE_ENV || 'development',
        sdkVersion: options.sdkVersion || '1.4.0',
      })
    });

    if (!connectRes.success) {
      throw new Error('Failed to connect website to Global Backend');
    }

    const { websiteId, syncToken } = connectRes;
    let routeCount = 0;

    // 2. Scan and sync routes (server-side only)
    if (isServer && (options.appDir || options.pagesDir)) {
      try {
        const routes = [
          ...(options.appDir ? scanRoutes(options.appDir) : []),
          ...(options.pagesDir ? scanPagesRouter(options.pagesDir) : []),
        ];

        // Deduplicate
        const seen = new Set<string>();
        const unique = routes.filter(r => {
          if (seen.has(r.path)) return false;
          seen.add(r.path);
          return true;
        });

        // 3. Sync routes to backend
        await fetch(`${this.apiUrl}/api/routes/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${syncToken}`
          },
          body: JSON.stringify({ websiteId, routes: unique })
        });

        // 3b. Scan and sync components to backend
        try {
          const comps = scanComponents(process.cwd());
          if (comps.length > 0) {
            await fetch(`${this.apiUrl}/api/components/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${syncToken}`
              },
              body: JSON.stringify({ websiteId, components: comps })
            });
            if (options.debug) {
              console.log(`[GlobalBackend] Synced ${comps.length} components for ${websiteId}`);
            }
          }
        } catch (cErr: any) {
          console.warn('[GlobalBackend] Component sync warning:', cErr.message);
        }

        routeCount = unique.length;
        if (options.debug) {
          console.log(`[GlobalBackend] Synced ${routeCount} routes for ${websiteId}`);
        }
      } catch (err: any) {
        console.warn('[GlobalBackend] Route sync warning:', err.message);
      }
    }

    // 4. Set up SyncManager
    const syncManager = new SyncManager({
      backendUrl: this.apiUrl,
      websiteId,
      syncToken,
      debug: options.debug
    });

    if (typeof window !== 'undefined') {
      await syncManager.connect();
    }

    this.syncManager = syncManager;

    return { websiteId, syncToken, routeCount, syncManager };
  }

  /** Proxy event listeners to the internal SyncManager */
  on(event: string, cb: (data: any) => void): () => void {
    if (this.syncManager) return this.syncManager.on(event as any, cb);
    return () => {};
  }

  off(event: string, cb: (data: any) => void) {
    this.syncManager?.off(event, cb);
  }
}

/**
 * Scan App Router directory for route files.
 * Detects: pages, API routes, dynamic segments, route groups.
 */
export function scanRoutes(dir: string, basePath = ''): ProjectRoute[] {
  if (typeof window !== 'undefined') return [];

  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  let results: ProjectRoute[] = [];
  if (!fs.existsSync(dir)) return results;

  const IGNORE = new Set(['.next', 'node_modules', '.git', 'dist', 'build', '.turbo', '__tests__', '__mocks__']);

  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (IGNORE.has(file)) continue;

    const fullPath = path.join(dir, file);
    let stat: import('fs').Stats;
    try { stat = fs.statSync(fullPath); } catch { continue; }

    if (stat.isDirectory()) {
      // Route groups like (dashboard) don't add to path
      const isGroup = file.startsWith('(') && file.endsWith(')');
      const folderSegment = isGroup ? '' : file;
      const newBase = folderSegment ? path.join(basePath, folderSegment) : basePath;
      results = results.concat(scanRoutes(fullPath, newBase));
    } else {
      const isPage = /^page\.(tsx?|jsx?)$/.test(file);
      const isApiRoute = /^route\.(tsx?|jsx?)$/.test(file);

      if (isPage || isApiRoute) {
        let slug = basePath.replace(/\\/g, '/');
        if (!slug.startsWith('/')) slug = '/' + slug;
        if (slug.endsWith('/') && slug.length > 1) slug = slug.slice(0, -1);

        const isDynamic = /\[.+\]/.test(slug);
        const isCatchAll = /\[\.{3}.+\]/.test(slug);
        const type = isApiRoute ? 'api' : (isDynamic ? 'dynamic' : 'page');

        results.push({
          path: slug,
          slug,
          isDynamic,
          isCatchAll,
          type,
          title: slug === '/' ? 'Home' : slug.split('/').filter(Boolean).map(s => 
            s.replace(/[_-]/g, ' ').replace(/^\[(.+)\]$/, ':$1')
          ).join(' › ')
        } as any);
      }
    }
  }

  return results;
}

/**
 * Scan Pages Router directory for pages.
 */
export function scanPagesRouter(dir: string, basePath = ''): ProjectRoute[] {
  if (typeof window !== 'undefined') return [];

  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  let results: ProjectRoute[] = [];
  if (!fs.existsSync(dir)) return results;

  const SKIP = new Set(['_app', '_document', '_error', 'api']);
  const PAGE_EXTS = ['.tsx', '.ts', '.jsx', '.js'];

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    let stat: import('fs').Stats;
    try { stat = fs.statSync(fullPath); } catch { continue; }

    const baseName = path.basename(file, path.extname(file));
    if (SKIP.has(baseName) && !stat.isDirectory()) continue;

    if (stat.isDirectory()) {
      if (baseName === 'api') {
        // Scan API directory for Pages Router API routes
        const apiRoutes = scanApiDirectory(fullPath, '/api');
        results = results.concat(apiRoutes);
      } else if (!SKIP.has(baseName)) {
        results = results.concat(scanPagesRouter(fullPath, path.join(basePath, baseName)));
      }
    } else if (PAGE_EXTS.includes(path.extname(file))) {
      if (SKIP.has(baseName)) continue;
      let slug = path.join(basePath, baseName === 'index' ? '' : baseName).replace(/\\/g, '/');
      if (!slug.startsWith('/')) slug = '/' + slug;
      if (slug !== '/' && slug.endsWith('/')) slug = slug.slice(0, -1);
      const isDynamic = /\[.+\]/.test(slug);
      results.push({ path: slug, slug, isDynamic, type: 'page' } as any);
    }
  }

  return results;
}

function scanApiDirectory(dir: string, basePath: string): ProjectRoute[] {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  let results: ProjectRoute[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    let stat: import('fs').Stats;
    try { stat = fs.statSync(fullPath); } catch { continue; }
    const baseName = path.basename(file, path.extname(file));

    if (stat.isDirectory()) {
      results = results.concat(scanApiDirectory(fullPath, path.join(basePath, baseName)));
    } else if (['.tsx', '.ts', '.jsx', '.js'].includes(path.extname(file))) {
      let slug = path.join(basePath, baseName === 'index' ? '' : baseName).replace(/\\/g, '/');
      if (!slug.startsWith('/')) slug = '/' + slug;
      if (slug !== '/' && slug.endsWith('/')) slug = slug.slice(0, -1);
      results.push({ path: slug, slug, isDynamic: /\[.+\]/.test(slug), type: 'api' } as any);
    }
  }
  return results;
}

/**
 * Legacy compat: Synchronizes route files with the dashboard.
 */
export async function syncRoutes(client: GlobalBackendClient, appDir: string): Promise<any> {
  if (typeof window !== 'undefined') {
    throw new Error('syncRoutes is a server-only execution block.');
  }

  const routes = scanRoutes(appDir);
  const uniqueRoutes: ProjectRoute[] = [];
  const map = new Map<string, boolean>();
  for (const r of routes) {
    const key = r.path || r.slug;
    if (!map.has(key)) {
      map.set(key, true);
      uniqueRoutes.push(r);
    }
  }

  return client.fetch('/sync/pages', {
    method: 'POST',
    body: JSON.stringify({ routes: uniqueRoutes })
  });
}

/**
 * Traverses standard component directories to auto-discover frontend components, exports, and props.
 */
export function scanComponents(projectDir: string): any[] {
  if (typeof window !== 'undefined') return [];

  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  const searchDirs = [
    'src/components',
    'src/sections',
    'src/widgets',
    'src/modules',
    'src/app/components',
    'components',
    'sections',
    'widgets',
    'modules',
    'app/components'
  ];

  const results: any[] = [];
  const processed = new Set<string>();

  for (const subDir of searchDirs) {
    const fullPath = path.join(projectDir, subDir);
    if (fs.existsSync(fullPath)) {
      scanComponentDirectory(fullPath, subDir, projectDir, results, processed);
    }
  }

  return results;
}

function scanComponentDirectory(
  dir: string,
  subDir: string,
  projectDir: string,
  results: any[],
  processed: Set<string>
) {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat: import('fs').Stats;
    try { stat = fs.statSync(fullPath); } catch { continue; }

    if (stat.isDirectory()) {
      scanComponentDirectory(fullPath, path.join(subDir, file), projectDir, results, processed);
    } else {
      const ext = path.extname(file);
      if (!['.tsx', '.ts', '.jsx', '.js'].includes(ext)) continue;

      const relativePath = path.relative(projectDir, fullPath).replace(/\\/g, '/');
      if (processed.has(relativePath)) continue;
      processed.add(relativePath);

      let content = '';
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }

      const componentMatches: Array<{ name: string; props: string[] }> = [];

      // 1. Match default function Component({ ... })
      const funcRegex = /export\s+(default\s+)?function\s+([A-Z]\w*)\s*\(\s*\{\s*([^}]+)\s*\}\s*\)/g;
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        const compName = match[2];
        const rawProps = match[3];
        const props = rawProps.split(',').map(p => p.split('=')[0].trim()).filter(p => p && !p.startsWith('...'));
        componentMatches.push({ name: compName, props });
      }

      // 2. Match arrow const Component = ({ ... }) =>
      const arrowRegex = /export\s+const\s+([A-Z]\w*)\s*=\s*(?:React\.(?:FC|FunctionComponent)(?:<[^>]+>)?\s*=\s*)?\(\s*\{\s*([^}]+)\s*\}\s*\)\s*=>/g;
      while ((match = arrowRegex.exec(content)) !== null) {
        const compName = match[1];
        const rawProps = match[2];
        const props = rawProps.split(',').map(p => p.split('=')[0].trim()).filter(p => p && !p.startsWith('...'));
        componentMatches.push({ name: compName, props });
      }

      // 3. Fallback to default export name or class component name if no destructured params found
      if (componentMatches.length === 0) {
        const classRegex = /export\s+(default\s+)?(?:class|function)\s+([A-Z]\w*)/g;
        while ((match = classRegex.exec(content)) !== null) {
          componentMatches.push({ name: match[2], props: [] });
        }
      }

      for (const comp of componentMatches) {
        let type = 'Component';
        if (relativePath.includes('sections') || comp.name.toLowerCase().includes('section')) {
          type = 'Section';
        } else if (relativePath.includes('widgets') || comp.name.toLowerCase().includes('widget')) {
          type = 'Widget';
        } else if (relativePath.includes('modules') || comp.name.toLowerCase().includes('module')) {
          type = 'Module';
        }

        let route = '/';
        const nameLower = comp.name.toLowerCase();
        if (nameLower.includes('about')) route = '/about';
        else if (nameLower.includes('contact') || nameLower.includes('form')) route = '/contact';
        else if (nameLower.includes('blog') || nameLower.includes('article') || nameLower.includes('post')) route = '/blog';
        else if (nameLower.includes('privacy') || nameLower.includes('legal') || nameLower.includes('term')) route = '/privacy-policy';
        else if (nameLower.includes('service')) route = '/services';
        else if (nameLower.includes('testimonial') || nameLower.includes('review')) route = '/testimonials';

        results.push({
          name: comp.name,
          filePath: relativePath,
          route,
          componentType: type,
          props: comp.props
        });
      }
    }
  }
}

