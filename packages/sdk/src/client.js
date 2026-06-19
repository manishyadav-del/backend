export class GlobalBackendClient {
  constructor(config) {
    if (!config.apiKey) {
      throw new Error('GlobalBackendClient: apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL;
  }

  async fetch(endpoint, options = {}) {
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

  async getGlobalSettings() {
    return this.fetch('/global-settings');
  }

  async getPage(slug) {
    // encode slug to handle complex paths safely
    const encoded = encodeURIComponent(slug);
    return this.fetch(`/pages/by-slug/${encoded}`);
  }

  async getSeo(slug) {
    const encoded = encodeURIComponent(slug);
    return this.fetch(`/seo/by-slug/${encoded}`);
  }

  async getSitemap() {
    return this.fetch('/sitemap');
  }

  async getAllPages() {
    return this.fetch('/pages');
  }
}
