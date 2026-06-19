import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth.js';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';

    // Run all queries in parallel for performance
    const [
      pages,
      services,
      blogs,
      contacts,
      leads,
      forms,
      testimonials,
      faqs,
      teamMembers,
      notifications,
      recentActivity,
      recentLeads,
      recentSubmissions,
      unreadNotifications,
      newLeadsCount,
      publishedPages,
      draftPages,
      activeServices,
      totalBackups,
      totalMedia,
      totalUsers,
    ] = await Promise.all([
      // Counts
      prisma.page.count({ where: { projectId } }),
      prisma.service.count({ where: { projectId } }),
      prisma.blog.count({ where: { projectId } }),
      prisma.contact.count({ where: { projectId } }),
      prisma.lead.count({ where: { projectId } }),
      prisma.formSubmission.count({ where: { projectId } }),
      prisma.testimonial.count({ where: { projectId } }),
      prisma.fAQ.count({ where: { projectId } }),
      prisma.teamMember.count({ where: { projectId } }),
      prisma.notification.count({ where: { projectId } }),
      
      // Recent activity (last 20)
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      
      // Recent leads
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      
      // Recent form submissions
      prisma.formSubmission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      
      // Unread notifications
      prisma.notification.count({ where: { projectId, isRead: false } }),
      
      // New leads (last 7 days)
      prisma.lead.count({
        where: {
          projectId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      
      // Published pages
      prisma.page.count({ where: { projectId, status: 'published' } }),
      
      // Draft pages
      prisma.page.count({ where: { projectId, status: 'draft' } }),
      
      // Active services
      prisma.service.count({ where: { projectId, isVisible: true } }),
      
      // Backups
      prisma.backup.count({ where: { projectId } }),
      
      // Media
      prisma.media.count({ where: { projectId } }),
      
      // Users
      prisma.user.count(),
    ]);

    // Get recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: { projectId },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Get upcoming tasks from pages with scheduled dates
    const upcomingTasks = await prisma.page.findMany({
      where: {
        projectId,
        scheduledAt: { not: null, gte: new Date() },
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        status: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });

    // Get recent backups
    const recentBackups = await prisma.backup.findMany({
      where: { projectId },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    // Get system status (last backup, etc.)
    const lastBackup = recentBackups[0] || null;

    // Calculate profile completion (mock - based on available data)
    const profileSteps = {
      hasPages: pages > 0,
      hasServices: services > 0,
      hasBlog: blogs > 0,
      hasContacts: contacts > 0,
      hasTeam: teamMembers > 0,
      hasTestimonials: testimonials > 0,
      hasFaqs: faqs > 0,
    };
    const completedSteps = Object.values(profileSteps).filter(Boolean).length;
    const totalSteps = Object.keys(profileSteps).length;
    const profileCompletion = Math.round((completedSteps / totalSteps) * 100);

    // Format activity for frontend
    const formattedActivity = recentActivity.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      details: log.details,
      user: log.user?.name || log.user?.email || 'System',
      time: log.createdAt,
      timeAgo: getTimeAgo(log.createdAt),
    }));

    // Format notifications for frontend
    const formattedNotifications = recentNotifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      time: n.createdAt,
      timeAgo: getTimeAgo(n.createdAt),
    }));

    // Format leads for frontend
    const formattedLeads = recentLeads.map((lead) => ({
      id: lead.id,
      name: lead.name || 'Anonymous',
      email: lead.email || '-',
      service: lead.serviceInterest || '-',
      status: lead.status,
      date: lead.createdAt.toISOString().split('T')[0],
    }));

    // Format submissions for frontend
    const formattedSubmissions = recentSubmissions.map((sub) => ({
      id: sub.id,
      name: sub.name || 'Anonymous',
      email: sub.email || '-',
      type: sub.formType,
      date: sub.createdAt.toISOString().split('T')[0],
      status: sub.status,
    }));

    // Format upcoming tasks
    const formattedTasks = upcomingTasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.scheduledAt?.toISOString().split('T')[0] || 'No date',
      status: task.status,
    }));

    return NextResponse.json({
      success: true,
      data: {
        // KPI Stats
        stats: {
          pages,
          services,
          blogs,
          contacts,
          leads,
          forms,
          testimonials,
          faqs,
          teamMembers,
          media: totalMedia,
          backups: totalBackups,
          users: totalUsers,
          publishedPages,
          draftPages,
          activeServices,
          newLeads: newLeadsCount,
          unreadNotifications,
        },
        // Recent activity
        recentActivity: formattedActivity,
        // Notifications
        notifications: formattedNotifications,
        // Recent leads
        recentLeads: formattedLeads,
        // Recent form submissions
        recentSubmissions: formattedSubmissions,
        // Upcoming tasks
        upcomingTasks: formattedTasks,
        // System status
        systemStatus: {
          lastBackup: lastBackup ? {
            id: lastBackup.id,
            type: lastBackup.type,
            status: lastBackup.status,
            date: lastBackup.createdAt.toISOString().split('T')[0],
          } : null,
          totalBackups: totalBackups,
          totalMedia: totalMedia,
        },
        // Profile completion
        profileCompletion: {
          percentage: profileCompletion,
          steps: profileSteps,
          completedSteps,
          totalSteps,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}