import prisma from '@/lib/prisma.js';

export class SearchService {
  async search(projectId, query) {
    if (!query) {
      return { blogs: [], pages: [], services: [], faqs: [] };
    }

    const keyword = String(query).trim();

    const [blogs, pages, services, faqs] = await Promise.all([
      prisma.blog.findMany({
        where: {
          projectId,
          OR: [
            { title: { contains: keyword } },
            { content: { contains: keyword } },
            { excerpt: { contains: keyword } }
          ]
        },
        take: 10
      }),
      prisma.page.findMany({
        where: {
          projectId,
          status: 'published',
          OR: [
            { title: { contains: keyword } },
            { slug: { contains: keyword } }
          ]
        },
        take: 10
      }),
      prisma.service.findMany({
        where: {
          projectId,
          isVisible: true,
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } }
          ]
        },
        take: 10
      }),
      prisma.fAQ.findMany({
        where: {
          projectId,
          isVisible: true,
          OR: [
            { question: { contains: keyword } },
            { answer: { contains: keyword } }
          ]
        },
        take: 10
      })
    ]);

    return {
      blogs,
      pages,
      services,
      faqs
    };
  }
}

export const searchService = new SearchService();
export default searchService;
