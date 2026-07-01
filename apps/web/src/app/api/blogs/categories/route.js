import { createApiHandler } from '@/lib/apiHandler.js';
import { categoryService } from '@/lib/services/categoryService.js';
import { ValidationError } from '@/lib/errorLogger.js';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().nullable(),
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
      const categories = await categoryService.getAll(projectId, query);
      return { categories: Array.isArray(categories) ? categories : categories.items, pagination: categories.pagination };
    }
  },
  POST: {
    auth: 'jwt',
    schema: categorySchema,
    handler: async ({ body }) => {
      const category = await categoryService.create(body);
      return { category };
    }
  }
});
