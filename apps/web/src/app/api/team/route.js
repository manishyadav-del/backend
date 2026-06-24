import { createApiHandler } from '@/lib/apiHandler.js';
import { teamService } from '@/lib/services/teamService.js';
import { teamMemberSchema } from '@/lib/validators/index.js';
import { z } from 'zod';
import { ValidationError } from '@/lib/errorLogger.js';

const teamMemberCreateSchema = teamMemberSchema.extend({
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
      const result = await teamService.getAll(projectId, query);
      const members = Array.isArray(result) ? result : result.items;
      const pagination = Array.isArray(result) ? null : result.pagination;
      return { 
        members,
        ...(pagination && { pagination })
      };
    }
  },
  POST: {
    auth: 'jwt',
    schema: teamMemberCreateSchema,
    handler: async ({ body }) => {
      const member = await teamService.create(body);
      return { member };
    }
  }
});