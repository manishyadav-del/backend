import { createApiHandler } from '@/lib/apiHandler.js';
import { formService } from '@/lib/services/formService.js';
import { formSubmissionSchema } from '@/lib/validators/index.js';
import { z } from 'zod';
import { ValidationError } from '@/lib/errorLogger.js';

const formSubmissionCreateSchema = formSubmissionSchema.extend({
  projectId: z.string().optional(),
});

export const { GET, POST } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ query }) => {
      const projectId = query.projectId;
      if (!projectId) {
        throw new ValidationError('Project ID required');
      }
      const result = await formService.getAll(projectId, query);
      const submissions = Array.isArray(result) ? result : result.items;
      const pagination = Array.isArray(result) ? null : result.pagination;
      return { 
        submissions,
        ...(pagination && { pagination })
      };
    }
  },
  POST: {
    auth: 'dual',
    schema: formSubmissionCreateSchema,
    handler: async ({ body, project, user }) => {
      const projectId = project?.id || body.projectId || user?.projectId;
      if (!projectId) {
        throw new ValidationError('Project ID is required');
      }
      const submission = await formService.create({ ...body, projectId });
      return { submission };
    }
  }
});