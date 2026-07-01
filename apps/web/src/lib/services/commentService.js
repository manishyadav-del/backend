import { BaseService } from './baseService.js';
import prisma from '@/lib/prisma.js';

export class CommentService extends BaseService {
  constructor() {
    super('comment');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.blogId) {
      where.blogId = queryOptions.blogId;
    }
    if (queryOptions.status) {
      where.status = queryOptions.status;
    }
    if (queryOptions.search) {
      where.OR = [
        { authorName: { contains: queryOptions.search } },
        { authorEmail: { contains: queryOptions.search } },
        { content: { contains: queryOptions.search } }
      ];
    }
    return this.findAll(where, {
      ...queryOptions,
      include: {
        blog: {
          select: {
            title: true,
            slug: true
          }
        }
      }
    });
  }

  async create(data) {
    // Basic auto-approve or moderation checks could go here (e.g. check spam)
    return super.create(data);
  }

  async approve(id) {
    return this.update(id, { status: 'approved' });
  }

  async reject(id) {
    return this.update(id, { status: 'spam' });
  }
}

export const commentService = new CommentService();
export default commentService;
