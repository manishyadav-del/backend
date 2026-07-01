import { createApiHandler } from '@/lib/apiHandler.js';
import { contactService } from '@/lib/services/contactService.js';
import { contactSchema } from '@/lib/validators/index.js';
import { z } from 'zod';
import { ValidationError } from '@/lib/errorLogger.js';

const contactCreateSchema = contactSchema.extend({
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
      const result = await contactService.getAll(projectId, query);
      const contacts = Array.isArray(result) ? result : result.items;
      const pagination = Array.isArray(result) ? null : result.pagination;
      return { 
        contacts,
        ...(pagination && { pagination })
      };
    }
  },
  POST: {
    auth: 'jwt',
    schema: contactCreateSchema,
    handler: async ({ body }) => {
      const contact = await contactService.create(body);
      return { contact };
    }
  }
});