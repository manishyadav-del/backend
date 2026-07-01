import { createApiHandler } from '@/lib/apiHandler.js';
import { blogService } from '@/lib/services/blogService.js';
import { blogSchema } from '@/lib/validators/index.js';
import { ValidationError } from '@/lib/errorLogger.js';
import { z } from 'zod';

const blogCreateSchema = blogSchema.extend({
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
      const result = await blogService.getAll(projectId, query);
      const blogs = Array.isArray(result) ? result : result.items;
      const pagination = Array.isArray(result) ? null : result.pagination;
      return { 
        blogs,
        ...(pagination && { pagination })
      };
    }
  },
  POST: {
    auth: 'jwt',
    schema: blogCreateSchema,
    handler: async ({ body }) => {
      const blog = await blogService.create(body);
      return { blog };
    }
  }
});