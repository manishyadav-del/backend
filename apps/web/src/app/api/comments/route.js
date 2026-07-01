import { createApiHandler } from '@/lib/apiHandler.js';
import { commentService } from '@/lib/services/commentService.js';
import { ValidationError } from '@/lib/errorLogger.js';
import { z } from 'zod';

const commentCreateSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  blogId: z.string().min(1, 'Blog ID is required'),
  authorName: z.string().min(1, 'Name is required'),
  authorEmail: z.string().email('Invalid email address'),
  content: z.string().min(1, 'Comment text is required'),
});

export const { GET, POST } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ query }) => {
      const projectId = query.projectId;
      if (!projectId) {
        throw new ValidationError('Project ID required');
      }
      const result = await commentService.getAll(projectId, query);
      return { comments: Array.isArray(result) ? result : result.items, pagination: result.pagination };
    }
  },
  POST: {
    auth: 'none',
    schema: commentCreateSchema,
    handler: async ({ body }) => {
      const comment = await commentService.create(body);
      return { comment };
    }
  }
});
