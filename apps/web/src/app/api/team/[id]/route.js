import { createApiHandler } from '@/lib/apiHandler.js';
import { teamService } from '@/lib/services/teamService.js';
import { teamMemberSchema } from '@/lib/validators/index.js';

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const teamMember = await teamService.findById(params.id);
      return { teamMember };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: teamMemberSchema.partial(),
    handler: async ({ params, body }) => {
      const teamMember = await teamService.update(params.id, body);
      return { teamMember };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await teamService.delete(params.id);
      return { success: true };
    }
  }
});