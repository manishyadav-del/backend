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
      const data = await settingsService.getFooterSettings(projectId);
      return { success: true, data };
    }
  },
  PUT: {
    auth: 'jwt',
    handler: async ({ body, user }) => {
      const { projectId, ...footerConfig } = body;
      if (!projectId) {
        throw new ValidationError('Project ID required');
      }
      const data = await settingsService.updateFooterSettings(projectId, footerConfig, user.id);

      try {
        const websites = await prisma.website.findMany();
        for (const site of websites) {
          broadcastToWebsite(site.id, 'footer:update', footerConfig);
          broadcastToWebsite(site.id, 'website:sync', { action: 'REFRESH' });
        }
      } catch (err) {
        console.error('Failed to broadcast footer updates:', err);
      }

      return { success: true, data };
    }
  }
});
