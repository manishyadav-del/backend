export interface AgentConfig {
  authToken: string;
  onRouteSync?: (data: any) => Promise<void> | void;
  onContentSync?: (data: any) => Promise<void> | void;
  onModulesSync?: (modules: any) => Promise<void> | void;
  onModuleSync?: (moduleKey: string, data: any) => Promise<void> | void;
  framework?: string;
  environment?: string;
}

export function createAgentHandler(config: AgentConfig) {
  const { 
    authToken, 
    onRouteSync, 
    onContentSync, 
    onModulesSync,
    onModuleSync,
    framework = 'nextjs', 
    environment = 'production' 
  } = config;

  if (!authToken) {
    throw new Error('createAgentHandler: authToken is required to secure the agent APIs');
  }

  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization') || req.headers.get('x-agent-token');
    const token = authHeader ? authHeader.replace('Bearer ', '') : url.searchParams.get('token');

    if (token !== authToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const method = req.method;
    const path = url.pathname;

    try {
      if (method === 'GET') {
        if (path.endsWith('/discover-apis')) {
          const apis = [
            { method: 'GET', path: '/api/pages', description: 'Retrieve all pages and content blocks' },
            { method: 'GET', path: '/api/posts', description: 'Retrieve resource blogs' },
            { method: 'PUT', path: '/api/content', description: 'Synchronize block sections and layout changes' },
            { method: 'PATCH', path: '/api/settings', description: 'Synchronize global header, footer and analytics configurations' },
            { method: 'DELETE', path: '/api/posts', description: 'Remove dynamic blog post contents' }
          ];

          if (framework === 'wordpress') {
            apis.push({ method: 'GET', path: '/wp-json/wp/v2/pages', description: 'WP Native Pages endpoint' });
            apis.push({ method: 'GET', path: '/wp-json/wp/v2/posts', description: 'WP Native Posts endpoint' });
          }

          return new Response(JSON.stringify({
            success: true,
            apis,
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          status: 'connected',
          framework,
          environment,
          agentVersion: '1.0.0',
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (method === 'POST') {
        const body = await req.json();
        
        if (path.endsWith('/modules')) {
          if (onModulesSync) {
            await onModulesSync(body.modules || body);
          }
          return new Response(JSON.stringify({
            success: true,
            message: 'Modules synchronization complete',
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (path.endsWith('/sync-module')) {
          if (onModuleSync) {
            await onModuleSync(body.moduleKey, body.data);
          }
          return new Response(JSON.stringify({
            success: true,
            message: `Module "${body.moduleKey}" synchronization complete`,
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (path.endsWith('/sync-routes') || body.action) {
          if (onRouteSync) {
            await onRouteSync(body);
          }
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Routes sync complete',
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (path.endsWith('/sync-content')) {
          if (onContentSync) {
            await onContentSync(body);
          }
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Content sync complete',
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}
