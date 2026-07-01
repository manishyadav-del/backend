import { BaseService } from './baseService.js';
import prisma from '@/lib/prisma.js';
import { ConflictError } from '@/lib/errorLogger.js';

export class CategoryService extends BaseService {
  constructor() {
    super('blogCategory');
  }

  async getAll(projectId, queryOptions = {}) {
    // Auto-migration/seeding of legacy categories
    try {
      const count = await prisma.blogCategory.count({ where: { projectId } });
      if (count === 0) {
        // Fetch unique category strings from Blog
        const uniqueCats = await prisma.blog.findMany({
          where: { projectId, category: { not: null } },
          distinct: ['category'],
          select: { category: true }
        });

        for (const b of uniqueCats) {
          if (b.category && b.category.trim()) {
            const name = b.category.trim();
            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            // Check if slug exists to prevent duplicates
            const exists = await prisma.blogCategory.findFirst({
              where: { projectId, slug }
            });
            
            if (!exists) {
              await prisma.blogCategory.create({
                data: {
                  projectId,
                  name,
                  slug,
                  description: 'Auto-migrated category'
                }
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('[Category Auto-Migration Error]', err.message);
    }

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
    const existing = await prisma.blogCategory.findFirst({
      where: { projectId, slug }
    });
    if (existing) {
      throw new ConflictError('Category with this slug already exists for this project');
    }
    return super.create(data);
  }

  async update(id, data) {
    const category = await this.findById(id);
    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.blogCategory.findFirst({
        where: {
          projectId: category.projectId,
          slug: data.slug,
          id: { not: id }
        }
      });
      if (existing) {
        throw new ConflictError('Category with this slug already exists for this project');
      }
    }
    return super.update(id, data);
  }
}

export const categoryService = new CategoryService();
export default categoryService;
