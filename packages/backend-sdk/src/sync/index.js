import { validateSyncToken } from '../auth/index.js';

/**
 * Creates a connector middleware route handler for Next.js and React frontends.
 * Exposes endpoints to receive push updates from the Global Backend dashboard.
 * Supports Next.js App Router (standard Request/Response) and Pages Router (IncomingMessage, ServerResponse).
 * Handles automatic cache invalidation (revalidatePath/revalidateTag) for Next.js.
 * 
 * @param {object} options
 * @param {string} [options.secret] - JWT secret or signature key.
 * @param {function} [options.onSync] - Generic callback on any sync payload.
 * @param {function} [options.onPageUpdate] - Callback when page changes.
 * @param {function} [options.onRouteUpdate] - Callback when route changes.
 * @param {function} [options.onMediaUpdate] - Callback when media assets change.
 * @param {function} [options.onModuleSync] - Callback when module state changes.
 */
export function createConnector(options = {}) {
  const secret = options.secret || process.env.GLOBAL_BACKEND_SYNC_SECRET || 'your-super-secret-key';
  
  return async function handleConnector(req, res) {
    const isAppRouter = !res || typeof res.status !== 'function';
    
    try {
      let body;
      let token;
      let urlString = '';
      
      if (isAppRouter) {
        const request = req;
        urlString = request.url;
        token = request.headers.get('authorization') || request.headers.get('x-sync-token');
        const text = await request.text();
        body = text ? JSON.parse(text) : {};
      } else {
        token = req.headers['authorization'] || req.headers['x-sync-token'];
        body = req.body;
        urlString = `http://${req.headers.host}${req.url}`;
      }
      
      if (!token) {
        return jsonResponse(isAppRouter, res, { success: false, error: 'Unauthorized: Missing verification token.' }, 401);
      }
      
      // Verify token
      const decoded = validateSyncToken(token, secret);
      if (!decoded) {
        return jsonResponse(isAppRouter, res, { success: false, error: 'Unauthorized: Invalid token verification.' }, 401);
      }

      // Check for GET pull data requests
      if (req.method === 'GET') {
        const url = new URL(urlString);
        const typeQuery = url.searchParams.get('type');
        let data = [];
        if (options.onPull) {
          data = await options.onPull(typeQuery, Object.fromEntries(url.searchParams.entries()));
        }
        return jsonResponse(isAppRouter, res, { success: true, data }, 200);
      }

      const url = new URL(urlString);
      const pathname = url.pathname;
      const typeQuery = url.searchParams.get('type');

      // Determine webhook type (either from URL path suffix, query parameter, or payload body fields)
      let type = 'generic';
      if (pathname.endsWith('/page') || typeQuery === 'page' || body.page) {
        type = 'page';
      } else if (pathname.endsWith('/route') || typeQuery === 'route' || body.route) {
        type = 'route';
      } else if (pathname.endsWith('/media') || typeQuery === 'media' || body.media) {
        type = 'media';
      } else if (pathname.endsWith('/module') || typeQuery === 'module' || body.modules || body.moduleKey) {
        type = 'module';
      }

      const action = body.action || 'UPDATE';
      console.log(`[SDK Webhook] Received ${action} push event for type: ${type}`);

      // 1. Invoke General Callback
      if (options.onSync) {
        await options.onSync(body);
      }

      let revalidateTarget = null;

      // 2. Perform Routing and Revalidation triggers
      if (type === 'page') {
        const pageData = body.page || body;
        if (options.onPageUpdate) {
          await options.onPageUpdate(action, pageData);
        }
        
        // Track slug to revalidate
        if (pageData.slug) {
          revalidateTarget = pageData.slug === 'home' || pageData.slug === '/' ? '/' : `/${pageData.slug}`;
        }
      } 
      else if (type === 'route') {
        const routeData = body.route || body;
        if (options.onRouteUpdate) {
          await options.onRouteUpdate(action, routeData);
        }
        if (routeData.path) {
          revalidateTarget = routeData.path;
        }
      } 
      else if (type === 'media') {
        if (options.onMediaUpdate) {
          await options.onMediaUpdate(action, body.media || body);
        }
      } 
      else if (type === 'module') {
        if (options.onModuleSync) {
          await options.onModuleSync(body.moduleKey || 'modules', body.data || body.modules || body);
        }
      }

      // 3. Cache revalidation execution
      let revalidated = false;
      if (revalidateTarget) {
        try {
          // Dynamic import/require Next.js cache revalidators
          const cache = await import('next/cache');
          if (cache && typeof cache.revalidatePath === 'function') {
            console.log(`[SDK Webhook] Invoking revalidatePath for: ${revalidateTarget}`);
            cache.revalidatePath(revalidateTarget);
            cache.revalidateTag(revalidateTarget);
            revalidated = true;
          }
        } catch (err) {
          // Silent catch if not in Next.js server environment
          console.warn(`[SDK Webhook] Cache revalidation skip: not in Next.js server context (${err.message})`);
        }
      }

      return jsonResponse(isAppRouter, res, {
        success: true,
        message: `Successfully synchronized webhook push [${type}] [${action}]`,
        revalidated,
        path: revalidateTarget
      }, 200);

    } catch (error) {
      console.error('[SDK Webhook Error] Handing push event failed:', error);
      return jsonResponse(isAppRouter, res, { success: false, error: error.message }, 500);
    }
  };
}

/**
 * Sends a structured JSON response.
 * @private
 */
function jsonResponse(isAppRouter, res, payload, statusCode = 200) {
  if (isAppRouter) {
    return new Response(JSON.stringify(payload), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    res.status(statusCode).json(payload);
  }
}
