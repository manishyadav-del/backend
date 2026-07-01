import { NextResponse } from 'next/server';
import { navigationService } from '@/lib/services/navigationService.js';
import { validateApiKey } from '@/lib/apiKey.js';
import { parseQuery } from '@/lib/apiHandler.js';

/**
 * Public navigation endpoint — accessible via API key for frontend SDKs.
 * GET /api/navigation/public?location=header&apiKey=xxx
 * GET /api/navigation/public?location=footer&apiKey=xxx
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

    const location = query.location; // 'header' | 'footer' | undefined (all)
    let menus;

    if (location) {
      // Filter by location
      const all = await navigationService.getAll(project.id, {});
      const allItems = Array.isArray(all) ? all : (all.items || []);
      menus = allItems.filter(m => m.location === location);
    } else {
      const result = await navigationService.getAll(project.id, {});
      menus = Array.isArray(result) ? result : (result.items || []);
    }

    // Parse items JSON string if needed
    const parsedMenus = menus.map(menu => ({
      ...menu,
      items: typeof menu.items === 'string' ? JSON.parse(menu.items) : (menu.items || [])
    }));

    return NextResponse.json({ success: true, menus: parsedMenus });
  } catch (err) {
    console.error('[Navigation Public API]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
