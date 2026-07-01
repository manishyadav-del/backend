import { BaseService } from './baseService.js';
import prisma from '@/lib/prisma.js';
import { ConflictError } from '@/lib/errorLogger.js';

export class TagService extends BaseService {
  constructor() {
    super('blogTag');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.search) {
      where.OR = [
        { name: { contains: queryOptions.search } },
        { slug: { contains: queryOptions.search } }
      ];
    }
    return this.findAll(where, queryOptions);
  }

  async create(data) {
    const { projectId, slug } = data;
    const existing = await prisma.blogTag.findFirst({
      where: { projectId, slug }
    });
    if (existing) {
      throw new ConflictError('Tag with this slug already exists for this project');
    }
    return super.create(data);
  }

  async update(id, data) {
    const tag = await this.findById(id);
    if (data.slug && data.slug !== tag.slug) {
      const existing = await prisma.blogTag.findFirst({
        where: {
          projectId: tag.projectId,
          slug: data.slug,
          id: { not: id }
        }
      });
      if (existing) {
        throw new ConflictError('Tag with this slug already exists for this project');
      }
    }
    return super.update(id, data);
  }
}

export const tagService = new TagService();
export default tagService;
