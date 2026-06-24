import { createApiHandler } from '@/lib/apiHandler.js';
import { pageService } from '@/lib/services/pageService.js';

export const { GET } = createApiHandler({
  GET: {
    auth: 'apiKey',
    handler: async ({ params, project }) => {
      const decodedSlug = decodeURIComponent(params.slug);
      const data = await pageService.getBySlug(project.id, decodedSlug);
      return data;
    }
  }
});