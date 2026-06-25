import { NextResponse } from 'next/server';
import { pageService } from '@/lib/services/pageService.js';
import { validateApiKey } from '@/lib/apiKey.js';
import { parseQuery } from '@/lib/apiHandler.js';

/**
 * Public pages endpoint — accessible via API key for frontend SDKs.
 * GET /api/pages/public?apiKey=xxx&status=published
 */
export async function GET(request) {
  try {
    const query = parseQuery(request);
    const apiKeyValue = query.apiKey || request.headers.get('x-api-key');

    if (!apiKeyValue) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const project = await validateApiKey(apiKeyValue);
    if (!project) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const options = { ...query };
    
    if (!options.status) {
      options.status = 'PUBLISHED';
    } else if (options.status.toUpperCase() === 'ARCHIVED') {
      return NextResponse.json({ success: true, pages: [] });
    } else if (options.status.toUpperCase() === 'ALL') {
      options.status = { not: 'ARCHIVED' };
    } else {
      options.status = options.status.toUpperCase();
    }

    const result = await pageService.getAll(project.id, options);
    const pages = Array.isArray(result) ? result : (result.items || []);
    const pagination = Array.isArray(result) ? null : result.pagination;

    return NextResponse.json({
      success: true,
      pages,
      ...(pagination && { pagination })
    });
  } catch (err) {
    console.error('[Pages Public API]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
