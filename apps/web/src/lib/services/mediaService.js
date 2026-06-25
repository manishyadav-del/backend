import { BaseService } from './baseService.js';
import prisma from '../prisma.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const extensionMimeTypes = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

export class MediaService extends BaseService {
  constructor() {
    super('media');
  }

  async resolveProjectId(id) {
    if (!id) return 'default';
    const projectExists = await prisma.project.count({ where: { id } });
    if (projectExists > 0) return id;

    const website = await prisma.website.findUnique({ where: { id } });
    if (website && website.apiKey) {
      const project = await prisma.project.findUnique({ where: { apiKey: website.apiKey } });
      if (project) return project.id;
    }
    return id;
  }

  async getAll(projectId, queryOptions = {}) {
    const resolvedId = await this.resolveProjectId(projectId);
    const where = { projectId: resolvedId };
    if (queryOptions.folder) {
      where.folder = queryOptions.folder;
    }
    return this.findAll(where, queryOptions);
  }

  async syncFrontendMedia(projectId) {
    try {
      // 1. Resolve project ID robustly
      const resolvedProjectId = await this.resolveProjectId(projectId);

      // 2. Locate frontend directory
      let frontendDir = '';
      const candidatePaths = [
        path.join(process.cwd(), '..', '..', '..', 'ahealthplace-website'),
        path.join(process.cwd(), '..', 'ahealthplace-website'),
        'c:/Users/manis/OneDrive/Desktop/ahealthcare/ahealthplace-website'
      ];
      for (const p of candidatePaths) {
        if (existsSync(p)) {
          frontendDir = p;
          break;
        }
      }

      if (!frontendDir) {
        console.warn('[MediaSync] Frontend directory not found.');
        return { success: false, reason: 'Frontend directory not found' };
      }

      const frontendUploadsDir = path.join(frontendDir, 'public', 'uploads');
      if (!existsSync(frontendUploadsDir)) {
        console.log('[MediaSync] Frontend public/uploads directory does not exist.');
        return { success: true, count: 0 };
      }

      // 3. Scan files recursively
      const fileList = [];
      const getFilesRecursively = async (dir) => {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) {
            await getFilesRecursively(filePath);
          } else {
            fileList.push({ filePath, stat });
          }
        }
      };

      await getFilesRecursively(frontendUploadsDir);

      // 4. Destination backend directory
      const destDir = path.join(process.cwd(), 'public', 'uploads', resolvedProjectId);
      if (!existsSync(destDir)) {
        await fs.mkdir(destDir, { recursive: true });
      }

      let importedCount = 0;

      for (const file of fileList) {
        const name = path.basename(file.filePath);
        
        // Skip hidden or system files
        if (name.startsWith('.') || name === 'ahealthplace_website_id_123' || name === 'clx1234567890abcdef02') {
          continue;
        }

        const destFilePath = path.join(destDir, name);
        const fileUrl = `/uploads/${resolvedProjectId}/${name}`;

        // 5. Copy file to backend if not already present
        if (!existsSync(destFilePath)) {
          await fs.copyFile(file.filePath, destFilePath);
        }

        // 6. Check if registered in DB
        const existing = await prisma.media.findFirst({
          where: {
            projectId: resolvedProjectId,
            url: fileUrl
          }
        });

        if (!existing) {
          const ext = path.extname(name).toLowerCase();
          const mimeType = extensionMimeTypes[ext] || 'application/octet-stream';

          await prisma.media.create({
            data: {
              projectId: resolvedProjectId,
              filename: name,
              originalName: name,
              url: fileUrl,
              mimeType: mimeType,
              size: file.stat.size,
              folder: 'root',
              altText: ''
            }
          });
          importedCount++;
        }
      }

      console.log(`[MediaSync] Successfully synced frontend media. Imported ${importedCount} new items.`);
      return { success: true, count: importedCount };
    } catch (err) {
      console.error('[MediaSync] Failed to sync frontend media:', err);
      return { success: false, error: err.message };
    }
  }
}

export const mediaService = new MediaService();
export default mediaService;
