import { createApiHandler } from '@/lib/apiHandler.js';
import { settingsService } from '@/lib/services/settingsService.js';
import { ValidationError } from '@/lib/errorLogger.js';
import { prisma } from '@/lib/prisma.js';
import { broadcastToWebsite } from '@/lib/socket.js';

export const { GET, PUT } = createApiHandler({
  GET: {
    auth: 'public',
    handler: async ({ query }) => {
      const projectId = query.projectId;
      if (!projectId) {
        throw new ValidationError('Project ID required');
      }
      const data = await settingsService.getHeaderSettings(projectId);
      return { success: true, data };
    }
  },
  PUT: {
    auth: 'jwt',
    handler: async ({ body, user }) => {
      const { projectId, ...headerConfig } = body;
      if (!projectId) {
        throw new ValidationError('Project ID required');
      }
      const data = await settingsService.updateHeaderSettings(projectId, headerConfig, user.id);
      
      try {
        const websites = await prisma.website.findMany();
        for (const site of websites) {
          broadcastToWebsite(site.id, 'header:update', headerConfig);
          broadcastToWebsite(site.id, 'website:sync', { action: 'REFRESH' });
        }
      } catch (err) {
        console.error('Failed to broadcast header updates:', err);
      }

      return { success: true, data };
    }
  }
});
