import { createApiHandler } from '@/lib/apiHandler.js';
import { testimonialService } from '@/lib/services/testimonialService.js';
import { testimonialSchema } from '@/lib/validators/index.js';
import { z } from 'zod';
import { ValidationError } from '@/lib/errorLogger.js';

const testimonialCreateSchema = testimonialSchema.extend({
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
      const result = await testimonialService.getAll(projectId, query);
      const testimonials = Array.isArray(result) ? result : result.items;
      const pagination = Array.isArray(result) ? null : result.pagination;
      return { 
        testimonials,
        ...(pagination && { pagination })
      };
    }
  },
  POST: {
    auth: 'jwt',
    schema: testimonialCreateSchema,
    handler: async ({ body }) => {
      const testimonial = await testimonialService.create(body);
      return { testimonial };
    }
  }
});