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

  override async initialize() {
    await super.initialize();
    
    if ((this as any).isOffline) {
      console.warn('[GlobalBackendSDK] Page registry sync skipped: SDK is offline.');
      return;
    }
    
    // Sync registered pages to global backend
    if (globalPageRegistry.length > 0) {
      try {
        const registryRoutes = globalPageRegistry.map(item => ({
          slug: item.route,
          isDynamic: /\[.+\]/.test(item.route),
          name: item.name,
          title: item.title || item.name,
          layout: item.layout,
          appName: item.appName
        }));

        const url = `${this.backendUrl}/api/sync/pages`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          body: JSON.stringify({ routes: registryRoutes })
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || response.statusText);
        }

        if ((this as any).debugMode) {
          console.log(`[GlobalBackendSDK] Successfully synced ${globalPageRegistry.length} registered pages to ${url}`);
        }
      } catch (err: any) {
        console.warn('[GlobalBackendSDK] Page registry sync failed during initialization:', err.message);
      }
    }
  }
}

export interface PageRegistryItem {
  name: string;
  route: string;
  title?: string;
  layout?: string;
  appName?: string;
}

const globalPageRegistry: PageRegistryItem[] = [];

export function registerPage(meta: PageRegistryItem) {
  globalPageRegistry.push(meta);
}

export class GlobalBackendClient {
  public registerPage(meta: PageRegistryItem) {
    registerPage(meta);
  }
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
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await globalThis.fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.statusText}`);
      }
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after 15 seconds while calling ${url}. Ensure the backend is running at ${this.apiUrl}`);
      }
      throw error;
    }
  }

  async getSettings(): Promise<Settings> {
    const data = await this.fetch('/global-settings?apiKey=' + encodeURIComponent(this.apiKey));
    return data.data || data.settings || data;
  }

  async getHeader(projectId?: string): Promise<any> {
    const params = new URLSearchParams();
    const pId = projectId || (typeof process !== 'undefined' && process.env?.GLOBAL_BACKEND_WEBSITE_ID);
    if (pId) params.set('projectId', pId);
    const data = await this.fetch(`/global-settings/header?${params.toString()}`);
    return data.data || data;
  }

  async getFooter(projectId?: string): Promise<any> {
    const params = new URLSearchParams();
    const pId = projectId || (typeof process !== 'undefined' && process.env?.GLOBAL_BACKEND_WEBSITE_ID);
    if (pId) params.set('projectId', pId);
    const data = await this.fetch(`/global-settings/footer?${params.toString()}`);
    return data.data || data;
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

  async getLegalPage(type: string): Promise<any> {
    const encoded = encodeURIComponent(type);
    const data = await this.fetch(`/legal/public/${encoded}`);
    return data.legalPage || data.data || data;
  }

  /**
   * getNavigation — fetch navigation menus by location (e.g. 'header', 'footer').
   * Returns the menu items array for the given location, or all menus if no location given.
   */
  async getNavigation(location?: string): Promise<any[]> {
    const qs = location ? `?location=${encodeURIComponent(location)}` : '';
    const data = await this.fetch(`/navigation/public${qs}`);
    const menus: any[] = data.menus || [];
    if (location && menus.length > 0) {
      // Flatten items from the first matched menu
      return menus[0]?.items || [];
    }
    return menus;
  }

  /**
   * getBlogs — fetch published blogs from the backend.
   */
  async getBlogs(options: { page?: number; limit?: number; category?: string; search?: string; status?: string; pagePath?: string } = {}): Promise<{ blogs: any[]; pagination?: any }> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.category) params.set('category', options.category);
    if (options.search) params.set('search', options.search);
    if (options.status) params.set('status', options.status);
    if (options.pagePath) params.set('pagePath', options.pagePath);
    const data = await this.fetch(`/blogs/public?${params.toString()}`);
    return { blogs: data.blogs || [], pagination: data.pagination };
  }

  /**
   * getServices — fetch active services from the backend.
   */
  async getServices(options: { page?: number; limit?: number; search?: string; isVisible?: boolean } = {}): Promise<{ services: any[]; pagination?: any }> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.search) params.set('search', options.search);
    if (options.isVisible !== undefined) params.set('isVisible', String(options.isVisible));
    const data = await this.fetch(`/services/public?${params.toString()}`);
    return { services: data.services || [], pagination: data.pagination };
  }

  /**
   * getPages — fetch CMS pages from the backend.
   */
  async getPages(options: { status?: string; limit?: number; page?: number } = {}): Promise<{ pages: any[]; pagination?: any }> {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    const data = await this.fetch(`/pages/public?${params.toString()}`);
    return { pages: data.pages || [], pagination: data.pagination };
  }

  /**
   * getMedia — fetch media library items from the backend.
   */
  async getMedia(options: { limit?: number; type?: string; folder?: string; projectId?: string } = {}): Promise<any[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.type) params.set('type', options.type);
    if (options.folder) params.set('folder', options.folder);
    if (options.projectId) params.set('projectId', options.projectId);
    const data = await this.fetch(`/media?${params.toString()}`);
    return data.media || data.items || data.files || [];
  }

  /**
   * getCTAs — fetch active Call-To-Action campaigns from the backend.
   */
  async getCTAs(options: { type?: string } = {}): Promise<any[]> {
    const params = new URLSearchParams();
    if (options.type) params.set('type', options.type);
    const data = await this.fetch(`/cta?${params.toString()}`);
    return data.ctas || [];
  }

  /**
   * submitForm — submit a new form submission to the backend.
   */
  async submitForm(data: {
    formType: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    data?: any;
  }): Promise<any> {
    const response = await this.fetch('/forms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.submission || response;
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

    // 3c. Sync registered pages to /sync/pages
    if (globalPageRegistry.length > 0) {
      try {
        const registryRoutes = globalPageRegistry.map(item => ({
          slug: item.route,
          isDynamic: /\[.+\]/.test(item.route),
          name: item.name,
          title: item.title || item.name,
          layout: item.layout,
          appName: item.appName
        }));

        await this.fetch('/sync/pages', {
          method: 'POST',
          body: JSON.stringify({ routes: registryRoutes })
        });

        if (options.debug) {
          console.log(`[GlobalBackend] Synced ${globalPageRegistry.length} registered pages`);
        }
      } catch (err: any) {
        console.warn('[GlobalBackend] Pages registry sync warning:', err.message);
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

