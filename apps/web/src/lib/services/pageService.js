import { BaseService } from './baseService.js';
import prisma from '@/lib/prisma.js';
import { ConflictError, NotFoundError } from '@/lib/errorLogger.js';

export class PageService extends BaseService {
  constructor() {
    super('page');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = {};
    if (projectId && projectId !== 'all') {
      where.projectId = projectId;
    }
    
    if (queryOptions.status) {
      where.status = queryOptions.status;
    }
    if (queryOptions.search) {
      where.OR = [
        { title: { contains: queryOptions.search } },
        { slug: { contains: queryOptions.search } }
      ];
    }

    return this.findAll(where, {
      ...queryOptions,
      include: {
        seo: true,
        project: true,
        sections_rel: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: { versions: true, drafts: true }
        }
      }
    });
  }

  async getById(id) {
    return this.findById(id, {
      seo: true,
      sections_rel: {
        where: { isDeleted: false },
        orderBy: { sortOrder: 'asc' }
      },
      versions: {
        orderBy: { version: 'desc' },
        take: 10
      },
      drafts: {
        orderBy: { updatedAt: 'desc' },
        take: 5
      }
    });
  }

  async create(data, userId) {
    const { projectId, slug } = data;
    
    const existing = await prisma.page.findFirst({
      where: { projectId, slug }
    });
    if (existing) {
      throw new ConflictError('Page with this slug already exists');
    }

    const payload = { ...data };
    if (userId) {
      payload.authorId = userId;
    }

    const page = await prisma.page.create({
      data: payload,
      include: {
        seo: true,
        sections_rel: true
      }
    });

    await prisma.pageVersion.create({
      data: {
        pageId: page.id,
        version: 1,
        title: page.title,
        slug: page.slug,
        changeLog: 'Initial page creation',
        createdBy: userId
      }
    });

    return page;
  }

  async update(id, data, userId) {
    const page = await prisma.page.findUnique({
      where: { id },
      include: { versions: true }
    });

    if (!page) {
      throw new NotFoundError('Page not found');
    }

    if (data.slug && data.slug !== page.slug) {
      const existing = await prisma.page.findFirst({
        where: {
          projectId: page.projectId,
          slug: data.slug,
          id: { not: id }
        }
      });
      if (existing) {
        throw new ConflictError('Page with this slug already exists');
      }
    }

    const { seo, changeLog, ...rest } = data;
    const updatePayload = { ...rest };

    if (data.status === 'published' && !data.publishedAt) {
      updatePayload.publishedAt = new Date();
    }

    if (seo) {
      updatePayload.seo = {
        upsert: {
          create: seo,
          update: seo
        }
      };
    }

    const updatedPage = await prisma.page.update({
      where: { id },
      data: updatePayload,
      include: {
        seo: true,
        sections_rel: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (data.title || data.slug || data.status === 'published') {
      const nextVersion = (page.versions?.[0]?.version || 0) + 1;
      
      await prisma.pageVersion.create({
        data: {
          pageId: id,
          version: nextVersion,
          title: updatedPage.title,
          slug: updatedPage.slug,
          content: updatedPage.content,
          sections: updatedPage.sections,
          banner: updatedPage.banner,
          seo: seo ? JSON.stringify(seo) : null,
          changeLog: changeLog || 'Page updated',
          createdBy: userId
        }
      });
    }

    return updatedPage;
  }

  async softDelete(id) {
    await this.findById(id);
    return prisma.page.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
  }

  async updateLegacy(id, data) {
    await this.findById(id);
    return prisma.page.update({
      where: { id },
      data
    });
  }

  async getBySlug(projectId, slug) {
    const page = await prisma.page.findUnique({
      where: {
        projectId_slug: {
          projectId,
          slug,
        },
      },
      include: {
        seo: true,
        schema: true,
        sections_rel: {
          where: { isDeleted: false, isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundError('Page not found');
    }

    if (page.status.toUpperCase() !== 'PUBLISHED') {
      throw new NotFoundError('Page not published');
    }

    const globalSettings = await prisma.globalSetting.findUnique({
      where: { projectId },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    return {
      page: {
        id: page.id,
        slug: page.slug,
        title: page.title,
        status: page.status,
        isDynamic: page.slug.includes('[') && page.slug.includes(']'),
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      },
      seo: page.seo ? {
        metaTitle: page.seo.metaTitle,
        metaDesc: page.seo.metaDescription,
        canonicalUrl: page.seo.canonical,
        ogImage: page.seo.ogImage,
        robots: page.seo.robots,
        llmTxt: page.seo.llmTxt,
      } : null,
      contentBlocks: page.sections_rel || [],
      jsonLdSchema: page.schema ? page.schema.map(s => {
        try {
          return typeof s.content === 'string' ? JSON.parse(s.content) : s.content;
        } catch {
          return s.content;
        }
      }) : [],
      globalSettings: globalSettings ? {
        siteName: project?.name || '',
        favicon: globalSettings.favicon,
        primaryColor: globalSettings.brandColor,
        headerConfig: globalSettings.headerSettings ? JSON.parse(globalSettings.headerSettings) : null,
        footerConfig: globalSettings.footerSettings ? JSON.parse(globalSettings.footerSettings) : null,
        gaTrackingId: globalSettings.analytics ? JSON.parse(globalSettings.analytics).gaId : null,
        clarityTrackingId: globalSettings.analytics ? JSON.parse(globalSettings.analytics).clarityId : null,
      } : null,
    };
  }
}

export const pageService = new PageService();
export default pageService;
