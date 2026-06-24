import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma.js';
import { logError } from '@/lib/errorLogger.js';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

/**
 * GET /api/homepage?projectId=default
 *
 * Public (no auth) aggregated endpoint that returns all content
 * needed to render the magazine/blog homepage dynamically.
 *
 * Content auto-updates within 60 seconds of CMS changes.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const rawProjectId = url.searchParams.get('projectId') || 'default';

  try {
    // ── Resolve project ───────────────────────────────────────────────────────
    // Accept either "default" shorthand or a real project ID
    let project = await prisma.project.findUnique({
      where: { id: rawProjectId },
      select: { id: true, name: true, domain: true, status: true },
    });

    // Fallback: if "default" not found as an id, try finding the first active project
    if (!project) {
      project = await prisma.project.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, domain: true, status: true },
      });
    }

    if (!project) {
      return NextResponse.json(
        {
          featuredPosts: [],
          latestBlogs: [],
          categories: [],
          trendingPosts: [],
          popularPosts: [],
          recentArticles: [],
          services: [],
          testimonials: [],
          teamMembers: [],
          faqs: [],
          contacts: [],
          projectInfo: null,
        },
        { status: 200 }
      );
    }

    const projectId = project.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── Parallel DB queries ───────────────────────────────────────────────────
    const [
      allPublishedBlogs,
      trendingBlogs,
      publishedPages,
      services,
      testimonials,
      teamMembers,
      faqs,
      contacts,
    ] = await Promise.all([
      // All published blogs — used for featured, latest, categories, popular
      prisma.blog.findMany({
        where: { projectId, status: 'published' },
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
        orderBy: { publishedAt: 'desc' },
        take: 50, // Cap for performance — more than enough for all sections
      }),

      // Trending: published in last 30 days
      prisma.blog.findMany({
        where: {
          projectId,
          status: 'published',
          publishedAt: { gte: thirtyDaysAgo },
        },
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
        orderBy: { publishedAt: 'desc' },
        take: 6,
      }),

      // Published non-home pages (recent articles)
      prisma.page.findMany({
        where: { projectId, status: 'published', isHome: false },
        select: {
          id: true,
          title: true,
          slug: true,
          banner: true,
          publishedAt: true,
          createdAt: true,
          seo: { select: { metaDescription: true, ogImage: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 6,
      }),

      // Visible services
      prisma.service.findMany({
        where: { projectId, isVisible: true },
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          ctaText: true,
          ctaLink: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),

      // Visible testimonials
      prisma.testimonial.findMany({
        where: { projectId, isVisible: true },
        select: {
          id: true,
          clientName: true,
          clientImage: true,
          rating: true,
          content: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),

      // Visible team members
      prisma.teamMember.findMany({
        where: { projectId, isVisible: true },
        select: {
          id: true,
          name: true,
          role: true,
          photo: true,
          bio: true,
          socialLinks: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),

      // Visible FAQs
      prisma.fAQ.findMany({
        where: { projectId, isVisible: true },
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
        take: 10,
      }),

      // Contacts
      prisma.contact.findMany({
        where: { projectId },
        select: {
          id: true,
          type: true,
          label: true,
          value: true,
          icon: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    // ── Derive sections from allPublishedBlogs ────────────────────────────────

    // Featured posts: first 3 from all published (most recent)
    const featuredPosts = allPublishedBlogs.slice(0, 3);

    // Latest blogs: next 8 (skip featured)
    const latestBlogs = allPublishedBlogs.slice(0, 8);

    // Popular posts: last 5 of all published (oldest recently-published = "evergreen popular")
    const popularPosts = allPublishedBlogs.slice(0, 5);

    // Categories: distinct categories with counts
    const categoryMap = {};
    for (const blog of allPublishedBlogs) {
      if (blog.category) {
        categoryMap[blog.category] = (categoryMap[blog.category] || 0) + 1;
      }
    }
    const categories = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Recent articles from pages
    const recentArticles = publishedPages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      banner: page.banner || page.seo?.ogImage || null,
      excerpt: page.seo?.metaDescription || null,
      publishedAt: page.publishedAt || page.createdAt,
    }));

    // Parse team member social links
    const formattedTeam = teamMembers.map((m) => ({
      ...m,
      socialLinks: m.socialLinks
        ? (() => {
            try { return JSON.parse(m.socialLinks); } catch { return {}; }
          })()
        : {},
    }));

    return NextResponse.json(
      {
        featuredPosts,
        latestBlogs,
        categories,
        trendingPosts: trendingBlogs,
        popularPosts,
        recentArticles,
        services,
        testimonials,
        teamMembers: formattedTeam,
        faqs,
        contacts,
        projectInfo: {
          name: project.name,
          domain: project.domain,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    await logError(error.message, error.stack, '/api/homepage', 'error', rawProjectId);
    console.error('[/api/homepage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage content' },
      { status: 500 }
    );
  }
}
