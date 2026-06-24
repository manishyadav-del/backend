import { createApiHandler } from '@/lib/apiHandler.js';
import { faqService } from '@/lib/services/faqService.js';
import { faqSchema } from '@/lib/validators/index.js';
import { z } from 'zod';
import { ValidationError } from '@/lib/errorLogger.js';

const faqCreateSchema = faqSchema.extend({
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
      const result = await faqService.getAll(projectId, query);
      const faqs = Array.isArray(result) ? result : result.items;
      const pagination = Array.isArray(result) ? null : result.pagination;
      return { 
        faqs,
        ...(pagination && { pagination })
      };
    }
  },
  POST: {
    auth: 'jwt',
    schema: faqCreateSchema,
    handler: async ({ body }) => {
      const faq = await faqService.create(body);
      return { faq };
    }
  }
});