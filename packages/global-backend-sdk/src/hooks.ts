import { useState, useEffect, useCallback } from 'react';
import { Page, Settings, RouteFeatureData, RouteFeatureModule } from './types.js';

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
          const response = await fetch(url);
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
  routePath?: string
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<any>(fallbackProps || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComponent = useCallback(async () => {
    if (!client || !componentName) return;

    const apiKey = typeof client.getApiKey === 'function' ? client.getApiKey() : client.apiKey;
    const backendUrl = typeof client.getBackendUrl === 'function' ? client.getBackendUrl() : client.backendUrl;
    if (!apiKey || !backendUrl) return;

    const route = routePath || (typeof window !== 'undefined' ? window.location.pathname : '/');

    setLoading(true);
    try {
      const url = `${backendUrl}/api/components/data?name=${encodeURIComponent(componentName)}&route=${encodeURIComponent(route)}`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }
      });
      const json = await response.json();
      if (json.success && json.data) {
        setData({ ...fallbackProps, ...json.data });
        setError(null);
      } else {
        setData(fallbackProps || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch component data');
      setData(fallbackProps || null);
    } finally {
      setLoading(false);
    }
  }, [client, componentName, routePath, fallbackProps]);

  useEffect(() => {
    fetchComponent();
  }, [fetchComponent]);

  useEffect(() => {
    if (!client || typeof client.on !== 'function') return;

    const handleComponentUpdate = (updateData: any) => {
      const currentRoute = routePath || (typeof window !== 'undefined' ? window.location.pathname : '/');
      if (updateData && updateData.name === componentName && (updateData.route === currentRoute || updateData.route === '/')) {
        console.log('[SDK useComponentData] Real-time component update applied:', updateData);
        setData((prev: any) => ({ ...prev, ...updateData.data }));
      }
    };

    client.on('component:update', handleComponentUpdate);
    client.on('sync', (update: any) => {
      if (update.type === 'component') handleComponentUpdate(update.data);
    });

    return () => {
      if (typeof client.off === 'function') {
        client.off('component:update', handleComponentUpdate);
      }
    };
  }, [client, componentName, routePath]);

  return { data, loading, error, refetch: fetchComponent };
}

