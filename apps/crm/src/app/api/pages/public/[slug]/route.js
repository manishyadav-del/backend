import { NextResponse } from 'next/server';
import { pageService } from '@/lib/services/pageService.js';

export async function GET(request, context) {
  try {
    const params = context.params ? await context.params : {};
    const slug = params.slug;
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId') || 'demo';

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const data = await pageService.getBySlug(projectId, slug);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error.statusCode === 404 || error.message.includes('not found') || error.message.includes('not published')) {
      return NextResponse.json({ error: 'Page not found or not published' }, { status: 404 });
    }
    console.error('[Public Page API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
