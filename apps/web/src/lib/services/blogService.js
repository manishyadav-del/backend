import { BaseService } from './baseService.js';
import prisma from '@/lib/prisma.js';
import { ConflictError } from '@/lib/errorLogger.js';

export class BlogService extends BaseService {
  constructor() {
    super('blog');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    
    if (queryOptions.status) {
      where.status = queryOptions.status;
    }
    if (queryOptions.category) {
      where.category = queryOptions.category;
    }
    if (queryOptions.search) {
      where.OR = [
        { title: { contains: queryOptions.search, lte: undefined } }, // standard text match
        { content: { contains: queryOptions.search } },
        { excerpt: { contains: queryOptions.search } }
      ];
    }

    return this.findAll(where, queryOptions);
  }

  async create(data) {
    const { projectId, slug } = data;
    
    const existing = await prisma.blog.findFirst({
      where: { slug }
    });
    if (existing) {
      throw new ConflictError('Blog with this slug already exists');
    }

    const payload = { ...data };
    
    // Parse date fields into Date objects to prevent Prisma formatting validation issues
    if (payload.publishedAt) {
      const d = new Date(payload.publishedAt);
      payload.publishedAt = isNaN(d.getTime()) ? null : d;
    } else if (payload.status === 'published') {
      payload.publishedAt = new Date();
    } else {
      payload.publishedAt = null;
    }

    if (payload.scheduledAt) {
      const d = new Date(payload.scheduledAt);
      payload.scheduledAt = isNaN(d.getTime()) ? null : d;
    } else {
      payload.scheduledAt = null;
    }

    if (payload.targetPages !== undefined) {
      if (Array.isArray(payload.targetPages)) {
        payload.targetPages = JSON.stringify(payload.targetPages);
      } else if (payload.targetPages === null) {
        payload.targetPages = null;
      } else if (typeof payload.targetPages === 'object') {
        payload.targetPages = JSON.stringify(payload.targetPages);
      }
    }

    return super.create(payload);
  }

  async update(id, data) {
    const blog = await this.findById(id);

    if (data.slug && data.slug !== blog.slug) {
      const existing = await prisma.blog.findFirst({
        where: {
          slug: data.slug,
          id: { not: id }
        }
      });
      if (existing) {
        throw new ConflictError('Blog with this slug already exists');
      }
    }

    const payload = { ...data };
    
    // Parse date fields into Date objects to prevent Prisma formatting validation issues
    if (payload.publishedAt !== undefined) {
      if (payload.publishedAt) {
        const d = new Date(payload.publishedAt);
        payload.publishedAt = isNaN(d.getTime()) ? null : d;
      } else {
        payload.publishedAt = null;
      }
    } else if (payload.status === 'published' && blog.status !== 'published' && !blog.publishedAt) {
      payload.publishedAt = new Date();
    }

    if (payload.scheduledAt !== undefined) {
      if (payload.scheduledAt) {
        const d = new Date(payload.scheduledAt);
        payload.scheduledAt = isNaN(d.getTime()) ? null : d;
      } else {
        payload.scheduledAt = null;
      }
    }

    if (payload.targetPages !== undefined) {
      if (Array.isArray(payload.targetPages)) {
        payload.targetPages = JSON.stringify(payload.targetPages);
      } else if (payload.targetPages === null) {
        payload.targetPages = null;
      } else if (typeof payload.targetPages === 'object') {
        payload.targetPages = JSON.stringify(payload.targetPages);
      }
    }

    return super.update(id, payload);
  }

  /**
   * Fetch published blogs safe for public consumption (no auth required).
   * Used by the /api/homepage public endpoint to power the magazine homepage.
   *
   * @param {string} projectId
   * @param {{ limit?: number, category?: string|null, orderBy?: 'asc'|'desc' }} options
   */
  async getPublished(projectId, { limit = 10, category = null, orderBy = 'desc' } = {}) {
    const where = { projectId, status: 'published' };
    if (category) where.category = category;

    return prisma.blog.findMany({
      where,
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        category: true,
        featuredImage: true,
        author: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: { publishedAt: orderBy },
      take: limit,
    });
  }

  /**
   * Get distinct blog categories with post counts for the homepage category bar.
   * Used by the /api/homepage public endpoint.
   *
   * @param {string} projectId
   * @returns {Promise<Array<{ name: string, count: number }>>}
   */
  async getCategories(projectId) {
    const blogs = await prisma.blog.findMany({
      where: { projectId, status: 'published', category: { not: null } },
      select: { category: true },
    });

    const categoryMap = {};
    for (const { category } of blogs) {
      if (category) {
        categoryMap[category] = (categoryMap[category] || 0) + 1;
      }
    }

    return Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }
}

export const blogService = new BlogService();
export default blogService;
