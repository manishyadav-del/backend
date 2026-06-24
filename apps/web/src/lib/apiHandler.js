import { NextResponse } from 'next/server';
import { getAuthUser } from './auth.js';
import { validateApiKey } from './apiKey.js';
import { logError, ServiceError, ValidationError } from './errorLogger.js';

export function parseQuery(request) {
  const url = new URL(request.url);
  const query = {};
  url.searchParams.forEach((value, key) => {
    if (query[key]) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  });
  return query;
}

export async function parseBody(request, schema = null) {
  let body = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch (error) {
    throw new ValidationError('Invalid JSON body');
  }

  if (schema) {
    if (schema.safeParse) {
      const result = schema.safeParse(body);
      if (!result.success) {
        const issues = result.error.issues || result.error.errors || [];
        const errMsgs = issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new ValidationError(errMsgs);
      }
      return result.data;
    }
  }
  return body;
}

export function createApiHandler(methods) {
  const handlers = {};

  for (const [method, config] of Object.entries(methods)) {
    const isObjectConfig = typeof config === 'object' && config !== null && !Array.isArray(config);
    const handlerFn = isObjectConfig ? config.handler : config;
    const authType = isObjectConfig ? (config.auth || 'jwt') : 'jwt';
    const schema = isObjectConfig ? config.schema : null;

    handlers[method] = async function (request, context) {
      const url = new URL(request.url);
      let user = null;
      let project = null;

      try {
        // 1. Authentication
        if (authType === 'jwt') {
          user = getAuthUser(request);
          if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }
        } else if (authType === 'apiKey') {
          project = await validateApiKey(request);
          if (!project) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }
        } else if (authType === 'dual') {
          project = await validateApiKey(request);
          if (!project) {
            user = getAuthUser(request);
            if (!user) {
              return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
          }
        }

        // 2. Parse request details
        const query = parseQuery(request);
        const params = context?.params ? await context.params : {};
        
        let body = null;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          body = await parseBody(request, schema);
        }

        // 3. Call actual handler
        const responseData = await handlerFn({
          request,
          params,
          query,
          body,
          user,
          project
        });

        // 4. Return response
        if (responseData instanceof Response) {
          return responseData;
        }

        if (responseData && typeof responseData === 'object' && responseData.status && responseData.data !== undefined) {
          return NextResponse.json(responseData.data, { status: responseData.status, headers: responseData.headers });
        }

        const status = method === 'POST' ? 201 : 200;
        return NextResponse.json(responseData, { status });

      } catch (error) {
        // 5. Error handling
        if (error instanceof ServiceError) {
          return NextResponse.json(
            { error: error.message, code: error.code, details: error.details },
            { status: error.statusCode }
          );
        }

        const projectId = project?.id || user?.projectId || null;
        const userId = user?.id || null;
        await logError(error.message, error.stack, url.pathname, 'error', projectId, userId);
        console.error(`Error in [${method}] ${url.pathname}:`, error);

        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  }

  return handlers;
}
