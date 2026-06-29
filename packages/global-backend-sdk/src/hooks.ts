import { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Settings, RouteFeatureData, RouteFeatureModule } from './types.js';
import { getCentralSyncManager } from './sync-manager.js';

export function usePageContent(client: any, slug: string) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !slug) return;
    
    let active = true;
    setLoading(true);

    const fetchPage = async () => {
      try {
        let data: any = null;
        if (typeof client.getPage === 'function') {
          data = await client.getPage(slug);
        } else {
          // If it is the SDK instance directly
          const key = client.apiKey;
          const url = `${client.backendUrl}/api/pages/by-slug/${encodeURIComponent(slug)}`;
          const response = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': key
            }
          });
          const json = await response.json();
          data = json.page || json.data || json;
        }

        if (active) {
          // Normalize sections if necessary
          if (data && typeof data.sections === 'string') {
            try {
              data.sections_rel = JSON.parse(data.sections);
            } catch (e) {}
          }
          setPage(data);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to fetch page content');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPage();

    // Listen for WebSocket page updates
    const handlePageUpdate = (data: any) => {
      const pageData = data.page || data;
      const targetSlug = slug === 'home' || slug === '/' ? 'home' : slug;
      const incomingSlug = pageData.slug === '/' ? 'home' : pageData.slug;
      
      if (pageData && incomingSlug === targetSlug) {
        console.log('[SDK usePageContent] Real-time page update applied:', pageData);
        
        let parsedSections = pageData.sections_rel || [];
        if (typeof pageData.sections === 'string') {
          try {
            parsedSections = JSON.parse(pageData.sections);
          } catch (e) {}
        } else if (pageData.sections) {
          parsedSections = pageData.sections;
        }

        setPage(prev => {
          if (!prev) return pageData;
          return {
            ...prev,
            ...pageData,
            content: pageData.content || prev.content,
            seo: pageData.seo || prev.seo,
            sections_rel: parsedSections.length > 0 ? parsedSections : prev.sections_rel
          };
        });
      }
    };

    const handleRouteUpdate = (data: any) => {
      const routeData = data.route || data;
      const targetPath = slug === 'home' || slug === '/' ? '/' : `/${slug}`;
      if (routeData && routeData.path === targetPath) {
        console.log('[SDK usePageContent] Real-time route update applied:', routeData);
        setPage(prev => {
          if (!prev) return null;
          return {
            ...prev,
            title: routeData.title || prev.title,
            seo: prev.seo ? {
              ...prev.seo,
              metaTitle: routeData.metaTitle !== undefined ? routeData.metaTitle : prev.seo.metaTitle,
              metaDescription: routeData.metaDescription !== undefined ? routeData.metaDescription : prev.seo.metaDescription,
            } : {
              metaTitle: routeData.metaTitle || null,
              metaDescription: routeData.metaDescription || null,
              urlSlug: null,
              canonical: null,
              ogImage: null,
              robots: null
            },
            status: routeData.status === 'active' ? 'published' : 'draft'
          };
        });
      }
    };

    const handleContentUpdate = (data: any) => {
      const contentData = data.content || data;
      const targetSlug = slug === 'home' || slug === '/' ? 'home' : slug;
      const incomingSlug = data.slug === '/' ? 'home' : data.slug;
      
      if (contentData && incomingSlug === targetSlug) {
        console.log('[SDK usePageContent] Real-time content update applied:', contentData);
        
        let parsedSections = [];
        if (contentData.sections) {
          parsedSections = typeof contentData.sections === 'string' ? JSON.parse(contentData.sections) : contentData.sections;
        }

        setPage(prev => {
          if (!prev) return null;
          return {
            ...prev,
            content: typeof contentData === 'string' ? contentData : JSON.stringify(contentData),
            sections_rel: parsedSections.length > 0 ? parsedSections : prev.sections_rel
          };
        });
      }
    };

    // Listen for postMessage from parent Live Editor
    const handleWindowMessage = (event: MessageEvent) => {
      const { data } = event;
      if (!data) return;

      if (data.type === 'live-editor:sections-update' && data.sections) {
        console.log('[SDK usePageContent] Received real-time sections update via postMessage:', data.sections);
        setPage(prev => {
          if (!prev) return null;
          return {
            ...prev,
            sections_rel: data.sections
          };
        });
      }

      if (data.type === 'live-editor:page-update' && data.page) {
        console.log('[SDK usePageContent] Received real-time page update via postMessage:', data.page);
        setPage(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ...data.page
          };
        });
      }
    };

    window.addEventListener('message', handleWindowMessage);

    if (typeof client.on === 'function') {
      client.on('page:update', handlePageUpdate);
      client.on('route:update', handleRouteUpdate);
      client.on('content:update', handleContentUpdate);
      client.on('sync', (update: any) => {
        if (update.type === 'page') {
          handlePageUpdate(update.data);
        } else if (update.type === 'route') {
          handleRouteUpdate(update.data);
        } else if (update.type === 'content') {
          handleContentUpdate(update.data);
        }
      });
    }

    return () => {
      active = false;
      window.removeEventListener('message', handleWindowMessage);
      if (typeof client.off === 'function') {
        client.off('page:update', handlePageUpdate);
        client.off('route:update', handleRouteUpdate);
        client.off('content:update', handleContentUpdate);
      }
    };
  }, [client, slug]);

  return { page, loading, error };
}

export function useGlobalSettings(client: any) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;

    let active = true;
    setLoading(true);

    const fetchSettings = async () => {
      try {
        let data: any = null;
        if (typeof client.getSettings === 'function') {
          data = await client.getSettings();
        } else {
          const key = client.apiKey;
          const url = `${client.backendUrl}/api/global-settings?apiKey=${encodeURIComponent(key)}`;
          const response = await fetch(url, {
            headers: {
              'x-api-key': key
            }
          });
          const json = await response.json();
          data = json.data || json.settings || json;
        }

        if (active) {
          setSettings(data);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to fetch global settings');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    // Listen for WebSocket updates
    const handleSettingsUpdate = (data: any) => {
      console.log('[SDK useGlobalSettings] Real-time settings update applied:', data);
      setSettings(prev => {
        if (!prev) return data;
        return {
          ...prev,
          ...data,
          brand: data.brand || prev.brand,
          header: data.header || prev.header,
          footer: data.footer || prev.footer,
          analytics: data.analytics || prev.analytics,
          contacts: data.contacts || prev.contacts
        };
      });
    };

    const handleHeaderUpdate = (data: any) => {
      console.log('[SDK useGlobalSettings] Real-time header update applied:', data);
      setSettings(prev => {
        if (!prev) return null;
        return {
          ...prev,
          header: {
            ...prev.header,
            ...data
          }
        };
      });
    };

    const handleFooterUpdate = (data: any) => {
      console.log('[SDK useGlobalSettings] Real-time footer update applied:', data);
      setSettings(prev => {
        if (!prev) return null;
        return {
          ...prev,
          footer: {
            ...prev.footer,
            ...data
          }
        };
      });
    };

    if (typeof client.on === 'function') {
      client.on('settings:update', handleSettingsUpdate);
      client.on('header:update', handleHeaderUpdate);
      client.on('footer:update', handleFooterUpdate);
      client.on('sync', (update: any) => {
        if (update.type === 'settings' || update.type === 'brand') {
          handleSettingsUpdate(update.data);
        } else if (update.type === 'header') {
          handleHeaderUpdate(update.data);
        } else if (update.type === 'footer') {
          handleFooterUpdate(update.data);
        }
      });
    }

    return () => {
      active = false;
      if (typeof client.off === 'function') {
        client.off('settings:update', handleSettingsUpdate);
        client.off('header:update', handleHeaderUpdate);
        client.off('footer:update', handleFooterUpdate);
      }
    };
  }, [client]);

  return { settings, loading, error };
}

/**
 * useRouteFeature — fetches the backend module assigned to a frontend route.
 *
 * @param client   GlobalBackendSDK / GlobalBackendClient instance
 * @param pathname The current route path, e.g. '/blog', '/contact'
 *
 * @returns { module, data, config, loading, error, refetch }
 *
 * Example:
 *   const { module, data } = useRouteFeature(client, '/blog');
 *   // module === 'blog'
 *   // data   === { posts: [...] }
 */
export function useRouteFeature<T = any>(
  client: any,
  pathname: string
): {
  module: RouteFeatureModule | null;
  data: T | null;
  config: Record<string, any> | null;
  route: RouteFeatureData['route'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [featureData, setFeatureData] = useState<RouteFeatureData<T> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeature = useCallback(async () => {
    if (!client || !pathname) return;

    const apiKey = typeof client.getApiKey === 'function' ? client.getApiKey() : client.apiKey;
    const backendUrl = typeof client.getBackendUrl === 'function' ? client.getBackendUrl() : client.backendUrl;
    if (!apiKey || !backendUrl) return;

    setLoading(true);
    try {
      const url = `${backendUrl}/api/routes/feature?path=${encodeURIComponent(pathname)}`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.success) {
        setFeatureData(json as RouteFeatureData<T>);
        setError(null);
      } else {
        setError(json.error || 'Failed to fetch route feature');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch route feature');
    } finally {
      setLoading(false);
    }
  }, [client, pathname]);

  useEffect(() => {
    fetchFeature();
  }, [fetchFeature]);

  useEffect(() => {
    if (!client || typeof client.on !== 'function') return;

    // Listen for real-time module assignment changes
    const handleModuleUpdate = (data: any) => {
      const targetPath = pathname === 'home' || pathname === '/' ? '/' : pathname;
      if (data && data.path === targetPath) {
        console.log('[SDK useRouteFeature] Real-time module update:', data);
        // Refetch full data (module data may have changed too)
        fetchFeature();
      }
    };

    client.on('route:module-update', handleModuleUpdate);
    client.on('sync', (update: any) => {
      if (update.type === 'route:module') handleModuleUpdate(update.data);
    });

    return () => {
      if (typeof client.off === 'function') {
        client.off('route:module-update', handleModuleUpdate);
      }
    };
  }, [client, pathname, fetchFeature]);

  return {
    module: featureData?.module ?? null,
    data: featureData?.data ?? null,
    config: featureData?.config ?? null,
    route: featureData?.route ?? null,
    loading,
    error,
    refetch: fetchFeature
  };
}

/**
 * useComponentData — dynamically fetches backend content props for a component
 * and subscribes to real-time WebSocket changes.
 */
export function useComponentData<T = any>(
  client: any,
  componentName: string,
  fallbackProps?: T,
  routePath?: string,
  options?: { refreshInterval?: number; mode?: 'preview' | 'dashboard' | 'background' }
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isReconnecting: boolean;
} {
  const route = routePath || (typeof window !== 'undefined' ? window.location.pathname : '/');

  const fallbackPropsRef = useRef(fallbackProps);
  fallbackPropsRef.current = fallbackProps;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
    isReconnecting: boolean;
  }>(() => {
    if (!client) {
      return { data: fallbackProps || null, loading: false, error: null, isReconnecting: false };
    }
    const manager = getCentralSyncManager(client);
    const key = `${componentName}::${route}`;
    const cached = manager.getCache(key);
    return {
      data: cached ? cached.data : (fallbackProps || null),
      loading: cached ? manager.isFetching(key) : true,
      error: cached ? cached.error : null,
      isReconnecting: manager.isClientReconnecting()
    };
  });

  useEffect(() => {
    if (!client || !componentName) return;

    const manager = getCentralSyncManager(client);

    const unsubscribe = manager.subscribe(
      componentName,
      route,
      fallbackPropsRef.current,
      optionsRef.current,
      (newState) => {
        setState(newState);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [client, componentName, route]);

  const refetch = useCallback(() => {
    if (client && componentName) {
      const manager = getCentralSyncManager(client);
      manager.forceFetch(componentName, route);
    }
  }, [client, componentName, route]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    isReconnecting: state.isReconnecting,
    refetch
  };
}

/**
 * useNavigation — fetches navigation items from the backend for a given location.
 * Supports real-time WebSocket updates.
 *
 * @param client   GlobalBackendClient instance
 * @param location 'header' | 'footer' | string
 *
 * @returns { items, menus, loading, error, refetch }
 *
 * Example:
 *   const { items } = useNavigation(sdk, 'header');
 *   // items === [{ label: 'Home', href: '/', children: [] }, ...]
 */
export function useNavigation(client: any, location?: string) {
  const [items, setItems] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNav = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const result = await client.getNavigation(location);
      if (location) {
        // result is the items array directly
        setItems(Array.isArray(result) ? result : []);
      } else {
        // result is array of menus
        setMenus(Array.isArray(result) ? result : []);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch navigation');
    } finally {
      setLoading(false);
    }
  }, [client, location]);

  useEffect(() => {
    fetchNav();
  }, [fetchNav]);

  useEffect(() => {
    if (!client || typeof client.on !== 'function') return;

    const handleNavUpdate = (data: any) => {
      if (!location || data.location === location) {
        const updatedItems = typeof data.items === 'string'
          ? JSON.parse(data.items)
          : (data.items || []);
        if (location) {
          setItems(updatedItems);
        } else {
          fetchNav();
        }
      }
    };

    client.on('navigation:update', handleNavUpdate);
    client.on('sync', (update: any) => {
      if (update.type === 'navigation') handleNavUpdate(update.data);
    });

    return () => {
      if (typeof client.off === 'function') {
        client.off('navigation:update', handleNavUpdate);
      }
    };
  }, [client, location, fetchNav]);

  return { items, menus, loading, error, refetch: fetchNav };
}

/**
 * useBlogs — fetches blog posts from the backend with optional filtering.
 * Supports real-time WebSocket updates.
 *
 * @param client  GlobalBackendClient instance
 * @param options { page, limit, category, search, status }
 *
 * @returns { blogs, pagination, loading, error, refetch }
 */
export function useBlogs(
  client: any,
  options: { page?: number; limit?: number; category?: string; search?: string; status?: string } = {}
) {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchBlogs = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const result = await client.getBlogs(optionsRef.current);
      setBlogs(result.blogs || []);
      setPagination(result.pagination || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    if (!client || typeof client.on !== 'function') return;

    const handleBlogUpdate = () => fetchBlogs();

    client.on('blog:update', handleBlogUpdate);
    client.on('blog:create', handleBlogUpdate);
    client.on('blog:delete', handleBlogUpdate);
    client.on('sync', (update: any) => {
      if (update.type === 'blog') handleBlogUpdate();
    });

    return () => {
      if (typeof client.off === 'function') {
        client.off('blog:update', handleBlogUpdate);
        client.off('blog:create', handleBlogUpdate);
        client.off('blog:delete', handleBlogUpdate);
      }
    };
  }, [client, fetchBlogs]);

  return { blogs, pagination, loading, error, refetch: fetchBlogs };
}

/**
 * usePages — fetches CMS pages from the backend.
 * Supports real-time WebSocket updates.
 *
 * @param client  GlobalBackendClient instance
 * @param options { status, limit, page }
 *
 * @returns { pages, pagination, loading, error, refetch }
 */
export function usePages(
  client: any,
  options: { status?: string; limit?: number; page?: number } = {}
) {
  const [pages, setPages] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchPages = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const result = await client.getPages(optionsRef.current);
      setPages(result.pages || []);
      setPagination(result.pagination || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    if (!client || typeof client.on !== 'function') return;

    const handlePageUpdate = () => fetchPages();

    client.on('page:update', handlePageUpdate);
    client.on('page:create', handlePageUpdate);
    client.on('page:delete', handlePageUpdate);
    client.on('sync', (update: any) => {
      if (update.type === 'page') handlePageUpdate();
    });

    return () => {
      if (typeof client.off === 'function') {
        client.off('page:update', handlePageUpdate);
        client.off('page:create', handlePageUpdate);
        client.off('page:delete', handlePageUpdate);
      }
    };
  }, [client, fetchPages]);

  return { pages, pagination, loading, error, refetch: fetchPages };
}

/**
 * useCTAs — fetches active Call-To-Action campaigns from the backend.
 * Supports real-time updates.
 */
export function useCTAs(
  client: any,
  options: { type?: string } = {}
) {
  const [ctas, setCtas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchCtas = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const result = await client.getCTAs(optionsRef.current);
      setCtas(result || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch CTAs');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchCtas();
  }, [fetchCtas]);

  useEffect(() => {
    if (!client || typeof client.on !== 'function') return;

    const handleCtaUpdate = () => fetchCtas();

    client.on('cta:update', handleCtaUpdate);
    client.on('cta:create', handleCtaUpdate);
    client.on('cta:delete', handleCtaUpdate);
    client.on('sync', (update: any) => {
      if (update.type === 'cta') handleCtaUpdate();
    });

    return () => {
      if (typeof client.off === 'function') {
        client.off('cta:update', handleCtaUpdate);
        client.off('cta:create', handleCtaUpdate);
        client.off('cta:delete', handleCtaUpdate);
      }
    };
  }, [client, fetchCtas]);

  return { ctas, loading, error, refetch: fetchCtas };
}

/**
 * useSubmitForm — manages form submission state (loading, success, error) and triggers API.
 */
export function useSubmitForm(client: any) {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (data: {
    formType: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    data?: any;
  }) => {
    if (!client) {
      setError('SDK client not initialized');
      return null;
    }
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const result = await client.submitForm(data);
      setSuccess(true);
      return result;
    } catch (err: any) {
      setError(err.message || 'Form submission failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return { submit, loading, success, error, setSuccess, setError };
}

/**
 * useServices — fetch active services from the backend.
 * Supports real-time updates.
 */
export function useServices(
  client: any,
  options: { search?: string; isVisible?: boolean } = {}
) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchServices = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const result = await client.getServices(optionsRef.current);
      setServices(result.services || result || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (!client || typeof client.on !== 'function') return;

    const handleServiceUpdate = () => fetchServices();

    client.on('service:update', handleServiceUpdate);
    client.on('service:create', handleServiceUpdate);
    client.on('service:delete', handleServiceUpdate);
    client.on('sync', (update: any) => {
      if (update.type === 'service') handleServiceUpdate();
    });

    return () => {
      if (typeof client.off === 'function') {
        client.off('service:update', handleServiceUpdate);
        client.off('service:create', handleServiceUpdate);
        client.off('service:delete', handleServiceUpdate);
      }
    };
  }, [client, fetchServices]);

  return { services, loading, error, refetch: fetchServices };
}


