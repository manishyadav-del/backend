import { BaseService } from './baseService.js';
import prisma from '@/lib/prisma.js';
import { ConflictError } from '@/lib/errorLogger.js';
import { createNotification } from '@/lib/notify.js';

export class BlogService extends BaseService {
  constructor() {
    super('blog');
  }

  async getAll(projectId, queryOptions = {}) {
    // 1. Just-in-time publishing of matured scheduled posts
    try {
      await prisma.blog.updateMany({
        where: {
          projectId,
          status: 'scheduled',
          scheduledAt: { lte: new Date() }
        },
        data: {
          status: 'published',
          publishedAt: new Date()
        }
      });
    } catch (err) {
      console.error('[BlogService JIT Publish Error]', err.message);
    }

    const where = { projectId };
    
    if (queryOptions.status) {
      where.status = queryOptions.status;
    }
    if (queryOptions.categoryId) {
      where.categoryId = queryOptions.categoryId;
    } else if (queryOptions.category) {
      where.category = queryOptions.category;
    }
    if (queryOptions.search) {
      where.OR = [
        { title: { contains: queryOptions.search } },
        { content: { contains: queryOptions.search } },
        { excerpt: { contains: queryOptions.search } }
      ];
    }

    const include = {
      blogCategory: true,
      tags: true,
      authorUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true
        }
      },
      comments: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    };

    return this.findAll(where, { ...queryOptions, include });
  }

  async findBlogById(id) {
    const include = {
      blogCategory: true,
      tags: true,
      authorUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true
        }
      },
      comments: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    };
    return this.findById(id, include);
  }

  async create(data) {
    const { projectId, slug, tags, ...rest } = data;
    
    const existing = await prisma.blog.findFirst({
      where: { projectId, slug }
    });
    if (existing) {
      throw new ConflictError('Blog with this slug already exists');
    }

    const payload = { projectId, slug, ...rest };
    
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

    if (tags && Array.isArray(tags)) {
      payload.tags = {
        connect: tags.map(tagId => ({ id: tagId }))
      };
    }

    const blog = await super.create(payload, {
      blogCategory: true,
      tags: true,
      authorUser: true
    });
    
    await createNotification(
      blog.projectId,
      'blog',
      'New Blog Post Created',
      `Blog "${blog.title}" has been created.`,
      '/admin/blogs'
    );
    return blog;
  }

  async update(id, data) {
    const blog = await this.findById(id);

    if (data.slug && data.slug !== blog.slug) {
      const existing = await prisma.blog.findFirst({
        where: {
          projectId: blog.projectId,
          slug: data.slug,
          id: { not: id }
        }
      });
      if (existing) {
        throw new ConflictError('Blog with this slug already exists');
      }
    }

    const { tags, ...rest } = data;
    const payload = { ...rest };
    
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

    if (tags && Array.isArray(tags)) {
      payload.tags = {
        set: tags.map(tagId => ({ id: tagId }))
      };
    }

    const updatedBlog = await super.update(id, payload, {
      blogCategory: true,
      tags: true,
      authorUser: true
    });

    await createNotification(
      updatedBlog.projectId,
      'blog',
      'Blog Post Updated',
      `Blog "${updatedBlog.title}" has been updated.`,
      '/admin/blogs'
    );
    return updatedBlog;
  }

  async delete(id) {
    const blog = await this.findById(id);
    const result = await super.delete(id);
    await createNotification(
      blog.projectId,
      'blog',
      'Blog Post Deleted',
      `Blog "${blog.title}" has been deleted.`,
      '/admin/blogs'
    );
    return result;
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
