import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKey.js';
import { parseQuery } from '@/lib/apiHandler.js';
import { prisma } from '@/lib/prisma.js';

/**
 * Public redirects endpoint — accessible via API key for frontend middleware/SDKs.
 * GET /api/redirects/public?apiKey=xxx
 */
export async function GET(request) {
  try {
    const query = parseQuery(request);
    const apiKeyValue = query.apiKey || request.headers.get('x-api-key');

    if (!apiKeyValue) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    // Validate API key and get project
    const project = await validateApiKey(apiKeyValue);
    if (!project) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const redirects = await prisma.redirect.findMany({
      where: {
        projectId: project.id,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, redirects });
  } catch (err) {
    console.error('[Redirects Public API]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
