import { createApiHandler } from '@/lib/apiHandler.js';
import prisma from '@/lib/prisma.js';
import { NotFoundError } from '@/lib/errorLogger.js';

export const { POST } = createApiHandler({
  POST: {
    auth: 'jwt',
    handler: async ({ body, user }) => {
      const { pageId } = body;
      if (!pageId) {
        throw new Error('Page ID is required');
      }

      // 1. Fetch original page
      const original = await prisma.page.findUnique({
        where: { id: pageId },
        include: {
          seo: true,
          sections_rel: {
            where: { isDeleted: false }
          }
        }
      });

      if (!original) {
        throw new NotFoundError('Page not found');
      }

      // 2. Generate a unique slug
      let newSlug = `${original.slug}-copy`;
      let counter = 1;
      while (true) {
        const existing = await prisma.page.findFirst({
          where: { projectId: original.projectId, slug: newSlug }
        });
        if (!existing) break;
        newSlug = `${original.slug}-copy-${counter}`;
        counter++;
      }

      // 3. Create cloned page and SEO
      const newPage = await prisma.page.create({
        data: {
          projectId: original.projectId,
          title: `${original.title} (Copy)`,
          slug: newSlug,
          path: original.path,
          status: 'draft',
          content: original.content,
          sections: original.sections,
          banner: original.banner,
          template: original.template,
          visibility: original.visibility,
          password: original.password,
          authorId: user?.id || original.authorId,
          seo: original.seo ? {
            create: {
              metaTitle: original.seo.metaTitle ? `${original.seo.metaTitle} (Copy)` : null,
              metaDescription: original.seo.metaDescription,
              urlSlug: newSlug,
              canonical: original.seo.canonical,
              ogImage: original.seo.ogImage,
              robots: original.seo.robots,
              llmTxt: original.seo.llmTxt,
            }
          } : undefined
        },
        include: {
          seo: true
        }
      });

      // 4. Clone sections recursively (preserving parent-child structures)
      const idMapping = {};
      const originalSections = original.sections_rel || [];

      // Pass 1: Create sections without parentId
      for (const section of originalSections) {
        const newSection = await prisma.pageSection.create({
          data: {
            pageId: newPage.id,
            type: section.type,
            title: section.title,
            content: section.content,
            settings: section.settings,
            sortOrder: section.sortOrder,
            isVisible: section.isVisible,
            isDeleted: false,
            template: section.template,
          }
        });
        idMapping[section.id] = newSection.id;
      }

      // Pass 2: Update parentId for nested sections
      for (const section of originalSections) {
        if (section.parentId && idMapping[section.parentId]) {
          await prisma.pageSection.update({
            where: { id: idMapping[section.id] },
            data: { parentId: idMapping[section.parentId] }
          });
        }
      }

      // 5. Create initial PageVersion
      await prisma.pageVersion.create({
        data: {
          pageId: newPage.id,
          version: 1,
          title: newPage.title,
          slug: newPage.slug,
          changeLog: `Duplicated from page ${original.title} (ID: ${original.id})`,
          createdBy: user?.id || original.authorId
        }
      });

      return {
        success: true,
        page: newPage
      };
    }
  }
});
