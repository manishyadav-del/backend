import { createApiHandler } from '@/lib/apiHandler.js';
import { tagService } from '@/lib/services/tagService.js';
import { ValidationError } from '@/lib/errorLogger.js';
import { z } from 'zod';

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const { GET, POST } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ query }) => {
      const projectId = query.projectId;
      if (!projectId) {
        throw new ValidationError('Project ID required');
      }
      const tags = await tagService.getAll(projectId, query);
      return { tags: Array.isArray(tags) ? tags : tags.items, pagination: tags.pagination };
    }
  },
  POST: {
    auth: 'jwt',
    schema: tagSchema,
    handler: async ({ body }) => {
      const tag = await tagService.create(body);
      return { tag };
    }
  }
});
