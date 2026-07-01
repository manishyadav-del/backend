/**
 * Global Backend Service Layer
 * Provides a unified interface for the frontend to interact with the Global Backend CMS
 */

import { globalBackendClient } from '@/lib/global-backend';

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  content?: string;
  sections?: any[];
  status: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonical?: string;
    ogImage?: string;
    robots?: string;
  };
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  featureImage: string;
  author: string;
  categoryId: string;
  categoryName: string;
  date: string;
  status: string;
}

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  order: number;
  isExternal: boolean;
  children?: NavigationItem[];
}

export interface GlobalSettings {
  brand?: {
    name: string;
    logo?: string;
    favicon?: string;
  };
  header?: {
    logo?: string;
    navLinks?: NavigationItem[];
    sticky?: boolean;
    style?: string;
  };
  footer?: {
    columns?: any[];
    copyright?: string;
    socialLinks?: any[];
  };
  contacts?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  analytics?: {
    googleAnalytics?: string;
    tagManager?: string;
    clarity?: string;
    metaPixel?: string;
    linkedinTag?: string;
  };
}

class GlobalBackendService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_API_KEY || 'gbl_api_key_main_2024_v2';
    this.apiUrl = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL || 'http://localhost:3000';
  }

  // ==================== PAGES ====================

  /**
   * Get page content by slug
   */
  async getPage(slug: string): Promise<PageContent | null> {
    try {
      const data = await globalBackendClient.fetch<{ page?: PageContent; data?: PageContent }>(
        `/pages/by-slug/${encodeURIComponent(slug)}`
      );
      return data.page || data.data || null;
    } catch (error) {
      console.error(`Failed to fetch page ${slug}:`, error);
      return null;
    }
  }

  /**
   * Get all published pages
   */
  async getAllPages(): Promise<PageContent[]> {
    try {
      const data = await globalBackendClient.fetch<{ pages?: PageContent[]; data?: PageContent[] }>('/pages');
      return data.pages || data.data || [];
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      return [];
    }
  }

  // ==================== BLOGS ====================

  async getAllBlogs(pagePath?: string): Promise<any[]> {
    const result = await globalBackendClient.getBlogs({ pagePath });
    const rawBlogs = result.blogs || [];
    // Map backend fields to consistent schema
    return rawBlogs.map((blog: any) => ({
      id: blog.id,
      slug: blog.slug,
      title: blog.title,
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      featuredImage: blog.featuredImage || '',
      author: blog.author || 'Admin',
      category: blog.category || 'General',
      status: blog.status,
      publishedAt: blog.publishedAt || blog.createdAt || '',
      createdAt: blog.createdAt || '',
      targetPages: blog.targetPages ? (typeof blog.targetPages === 'string' ? JSON.parse(blog.targetPages) : blog.targetPages) : [],
    }));
  }

  /**
   * Get blog post by slug
   */
  async getBlogBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const data = await globalBackendClient.fetch<{ blog?: any; data?: any }>(
        `/blogs/public/${encodeURIComponent(slug)}`
      );
      const raw = data.blog || data.data || null;
      if (!raw) return null;
      // Map backend schema to frontend BlogPost interface
      return {
        id: raw.id,
        slug: raw.slug,
        title: raw.title,
        description: raw.excerpt || '',
        content: raw.content || '',
        featureImage: raw.featuredImage || '',
        author: raw.author || 'Admin',
        categoryId: raw.categoryId || '',
        categoryName: raw.category || 'General',
        date: raw.publishedAt || raw.createdAt || '',
        status: raw.status,
        excerpt: raw.excerpt || '',
        featuredImage: raw.featuredImage || '',
        publishedAt: raw.publishedAt || raw.createdAt || '',
        category: raw.category || 'General',
        createdAt: raw.createdAt || '',
      } as any;
    } catch (error) {
      console.error(`Failed to fetch blog ${slug}:`, error);
      return null;
    }
  }

  /**
   * Get featured blog posts
   */
  async getFeaturedBlogs(limit: number = 4): Promise<BlogPost[]> {
    try {
      const allBlogs = await this.getAllBlogs();
      return allBlogs.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch featured blogs:', error);
      return [];
    }
  }

  // ==================== SERVICES ====================

  /**
   * Get active services from global backend
   */
  async getServices(options: { search?: string; isVisible?: boolean; limit?: number; page?: number } = {}): Promise<any[]> {
    try {
      const data = await globalBackendClient.getServices(options);
      return data.services || [];
    } catch (error) {
      console.error('Failed to fetch services from global backend:', error);
      return [];
    }
  }

  // ==================== MEDIA ====================


  /**
   * Get all media items
   */
  async getAllMedia(): Promise<MediaItem[]> {
    try {
      const data = await globalBackendClient.fetch<{ media?: MediaItem[]; data?: MediaItem[] }>('/media');
      return data.media || data.data || [];
    } catch (error) {
      console.error('Failed to fetch media:', error);
      return [];
    }
  }

  /**
   * Get media by ID
   */
  async getMediaById(id: string): Promise<MediaItem | null> {
    try {
      const data = await globalBackendClient.fetch<{ media?: MediaItem; data?: MediaItem }>(`/media/${id}`);
      return data.media || data.data || null;
    } catch (error) {
      console.error(`Failed to fetch media ${id}:`, error);
      return null;
    }
  }

  // ==================== COMPONENTS ====================

  /**
   * Get component data by component name
   */
  async getComponentData(componentName: string, routePath?: string): Promise<any> {
    try {
      const endpoint = routePath 
        ? `/components/data?name=${encodeURIComponent(componentName)}&route=${encodeURIComponent(routePath)}`
        : `/components/data?name=${encodeURIComponent(componentName)}`;
      
      const data = await globalBackendClient.fetch<{ data?: any }>(endpoint);
      return data.data || null;
    } catch (error) {
      console.error(`Failed to fetch component ${componentName}:`, error);
      return null;
    }
  }

  // ==================== SETTINGS ====================

  /**
   * Get global settings
   */
  async getSettings(): Promise<GlobalSettings | null> {
    try {
      const data = await globalBackendClient.fetch<{ settings?: GlobalSettings; data?: GlobalSettings }>('/global-settings');
      return data.settings || data.data || null;
    } catch (error) {
      console.error('Failed to fetch global settings:', error);
      return null;
    }
  }

  /**
   * Get header configuration
   */
  async getHeaderConfig(): Promise<GlobalSettings['header'] | null> {
    try {
      const data = await globalBackendClient.getHeader();
      return data || null;
    } catch (error) {
      console.error('Failed to fetch header config:', error);
      return null;
    }
  }

  /**
   * Get footer configuration
   */
  async getFooterConfig(): Promise<GlobalSettings['footer'] | null> {
    try {
      const data = await globalBackendClient.getFooter();
      return data || null;
    } catch (error) {
      console.error('Failed to fetch footer config:', error);
      return null;
    }
  }

  // ==================== NAVIGATION ====================

  /**
   * Get navigation menu
   */
  async getNavigation(): Promise<NavigationItem[]> {
    try {
      const data = await globalBackendClient.fetch<{ navigation?: NavigationItem[]; data?: NavigationItem[] }>('/navigation');
      return data.navigation || data.data || [];
    } catch (error) {
      console.error('Failed to fetch navigation:', error);
      return [];
    }
  }

  // ==================== CATEGORIES ====================

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<any[]> {
    try {
      const data = await globalBackendClient.fetch<{ categories?: any[]; data?: any[] }>('/category');
      return data.categories || data.data || [];
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<any | null> {
    try {
      const data = await globalBackendClient.fetch<{ category?: any; data?: any }>(`/category/${encodeURIComponent(slug)}`);
      return data.category || data.data || null;
    } catch (error) {
      console.error(`Failed to fetch category ${slug}:`, error);
      return null;
    }
  }

  // ==================== SEO ====================

  /**
   * Get SEO data for a page
   */
  async getSEO(slug: string): Promise<any> {
    try {
      const data = await globalBackendClient.fetch<{ seo?: any; data?: any }>(`/seo/by-slug/${encodeURIComponent(slug)}`);
      return data.seo || data.data || null;
    } catch (error) {
      console.error(`Failed to fetch SEO for ${slug}:`, error);
      return null;
    }
  }

  // ==================== LEGAL PAGES ====================

  /**
   * Get legal page content
   */
  async getLegalPage(type: string): Promise<any> {
    try {
      const data = await globalBackendClient.fetch<{ legalPage?: any; data?: any }>(`/legal/public/${encodeURIComponent(type)}`);
      return data.legalPage || data.data || null;
    } catch (error) {
      console.error(`Failed to fetch legal page ${type}:`, error);
      return null;
    }
  }

  // ==================== ROUTE FEATURES ====================

  /**
   * Get feature/module assigned to a route
   */
  async getRouteFeature(pathname: string): Promise<{
    module: string | null;
    data: any;
    config: any;
  } | null> {
    try {
      const data = await globalBackendClient.fetch<{
        success: boolean;
        module?: string;
        data?: any;
        config?: any;
      }>(`/routes/feature?path=${encodeURIComponent(pathname)}`);
      
      if (data.success) {
        return {
          module: data.module || null,
          data: data.data || null,
          config: data.config || null,
        };
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch route feature for ${pathname}:`, error);
      return null;
    }
  }

  // ==================== REAL-TIME UPDATES ====================

  /**
   * Subscribe to real-time updates
   */
  on(event: string, callback: (data: any) => void): () => void {
    if (typeof sdk.on === 'function') {
      const result = sdk.on(event, callback);
      if (typeof result === 'function') {
        return result;
      }
    }
    return () => {};
  }

  /**
   * Unsubscribe from real-time updates
   */
  off(event: string, callback: (data: any) => void): void {
    if (typeof sdk.off === 'function') {
      sdk.off(event, callback);
    }
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Check if global backend is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Global backend health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const globalBackendService = new GlobalBackendService();

// Export class for testing or custom instances
export default GlobalBackendService;