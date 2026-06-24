import { createApiHandler } from '@/lib/apiHandler.js';
import { searchService } from '@/lib/services/searchService.js';
import { ValidationError } from '@/lib/errorLogger.js';

export const { GET } = createApiHandler({
  GET: {
    auth: 'dual',
    handler: async ({ query }) => {
      const projectId = query.projectId;
      if (!projectId) {
        throw new ValidationError('Project ID required');
      }
      const results = await searchService.search(projectId, query.q);
      return results;
    }
  }
});
