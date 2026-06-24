/**
 * Helper to structure and normalize page data structures.
 * Ensures JSON elements are parsed correctly for consumption in Next.js pages.
 */
export function normalizePageData(page) {
  if (!page) return null;
  
  let parsedContent = null;
  if (page.content) {
    try {
      parsedContent = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
    } catch (e) {
      console.warn(`[SDK Pages] Failed to parse page content JSON:`, e.message);
      parsedContent = page.content;
    }
  }

  return {
    id: page.id,
    slug: page.slug || '',
    title: page.title || '',
    content: parsedContent,
    seo: {
      title: page.seoTitle || page.title || '',
      description: page.seoDesc || '',
      ogImage: page.ogImage || ''
    },
    status: page.status || 'published',
    updatedAt: page.updatedAt || new Date().toISOString()
  };
}
