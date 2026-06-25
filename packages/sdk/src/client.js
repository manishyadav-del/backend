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
    return this.fetch(`/global-settings?apiKey=${encodeURIComponent(this.apiKey)}`);
  }

  async updateGlobalSettings(projectId, settings) {
    return this.fetch('/global-settings', {
      method: 'POST',
      body: JSON.stringify({ projectId, ...settings })
    });
  }

  async getBlogs(options = {}) {
    const params = new URLSearchParams({ apiKey: this.apiKey, ...options }).toString();
    return this.fetch(`/blogs/public?${params}`);
  }

  async getBlogBySlug(slug) {
    const encoded = encodeURIComponent(slug);
    return this.fetch(`/blogs/public/${encoded}?apiKey=${encodeURIComponent(this.apiKey)}`);
  }

  async createBlog(data) {
    return this.fetch('/blogs/public', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBlog(id, data) {
    return this.fetch(`/blogs/public/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteBlog(id) {
    return this.fetch(`/blogs/public/${id}`, {
      method: 'DELETE'
    });
  }

  async getNavigation(projectId) {
    return this.fetch(`/navigation?projectId=${encodeURIComponent(projectId)}`);
  }

  async updateNavigation(projectId, location, items) {
    return this.fetch('/navigation', {
      method: 'POST',
      body: JSON.stringify({ projectId, location, items })
    });
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
