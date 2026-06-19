import { Page, SEO, Settings, ProjectRoute } from './types.js';

export class GlobalBackendClient {
  private apiKey: string;
  private apiUrl: string;

  constructor(config: { apiKey: string; apiUrl?: string }) {
    if (!config.apiKey) {
      throw new Error('GlobalBackendClient: apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL || 'http://localhost:3000';
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
}

/**
 * Recursively scans directory for route files. Safe from browser bundle inclusion.
 */
export function scanRoutes(dir: string, basePath = ''): ProjectRoute[] {
  if (typeof window !== 'undefined') {
    return [];
  }

  // Require Node.js built-ins dynamically to prevent webpack failures on client compile
  const fs = require('fs');
  const path = require('path');

  let results: ProjectRoute[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      const folderName = file.startsWith('(') && file.endsWith(')') ? '' : file;
      const newBasePath = path.join(basePath, folderName);
      results = results.concat(scanRoutes(fullPath, newBasePath));
    } else if (file === 'page.tsx' || file === 'page.jsx' || file === 'page.js') {
      let slug = basePath.replace(/\\/g, '/');
      if (!slug.startsWith('/')) slug = '/' + slug;
      if (slug.endsWith('/') && slug.length > 1) slug = slug.slice(0, -1);
      const isDynamic = slug.includes('[') && slug.includes(']');
      results.push({ slug, isDynamic });
    }
  }

  return results;
}

/**
 * Synchronizes route files configuration with the Global Backend dashboard.
 */
export async function syncRoutes(client: GlobalBackendClient, appDir: string): Promise<any> {
  if (typeof window !== 'undefined') {
    throw new Error('syncRoutes is a server-only execution block.');
  }

  const routes = scanRoutes(appDir);
  const uniqueRoutes: ProjectRoute[] = [];
  const map = new Map<string, boolean>();
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
