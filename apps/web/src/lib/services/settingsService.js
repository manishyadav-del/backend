import { BaseService } from './baseService.js';
import prisma from '@/lib/prisma.js';
import { unstable_cache, revalidateTag } from 'next/cache';
import { NotFoundError } from '@/lib/errorLogger.js';

export const getCachedGlobalSettings = unstable_cache(
  async (apiKey) => {
    const project = await prisma.project.findUnique({
      where: { apiKey },
      include: {
        contacts: true,
        navigation: true,
      }
    });

    if (!project) return null;

    const globalSettings = await prisma.globalSetting.findUnique({
      where: { projectId: project.id }
    });

    let analytics = {};
    try {
      analytics = globalSettings?.analytics ? JSON.parse(globalSettings.analytics) : {};
    } catch { /* ignore */ }

    let headerSettings = {};
    let footerSettings = {};
    try {
      headerSettings = globalSettings?.headerSettings ? JSON.parse(globalSettings.headerSettings) : {};
      footerSettings = globalSettings?.footerSettings ? JSON.parse(globalSettings.footerSettings) : {};
    } catch { /* ignore */ }

    const mainMenu = project.navigation.find(n => n.location === 'main');
    const footerMenu = project.navigation.find(n => n.location === 'footer');
    let mainMenuItems = [];
    let footerMenuItems = [];
    try {
      mainMenuItems = mainMenu ? JSON.parse(mainMenu.items) : [];
      footerMenuItems = footerMenu ? JSON.parse(footerMenu.items) : [];
    } catch { /* ignore */ }

    return {
      project: {
        name: project.name,
        domain: project.domain,
        status: project.status,
      },
      brand: {
        logo: globalSettings?.logo || project.logo,
        favicon: globalSettings?.favicon || project.favicon,
        brandColor: globalSettings?.brandColor || project.brandColor,
      },
      header: {
        ...headerSettings,
        menu: mainMenuItems,
      },
      footer: {
        ...footerSettings,
        menu: footerMenuItems,
      },
      analytics: {
        googleAnalytics: analytics.gaId || analytics.googleAnalytics || null,
        tagManager: analytics.gtmId || analytics.tagManager || null,
        clarity: analytics.clarityId || analytics.clarity || null,
        metaPixel: analytics.metaPixelId || analytics.metaPixel || null,
        linkedinTag: analytics.linkedinTagId || analytics.linkedinTag || null,
        searchConsole: analytics.searchConsoleId || analytics.searchConsole || null,
      },
      contacts: project.contacts.map(c => ({
        type: c.type,
        label: c.label,
        value: c.value,
        icon: c.icon,
      })),
      maintenance: globalSettings?.maintenanceMode || false,
      cookieConsent: globalSettings?.cookieConsent ?? true,
    };
  },
  ['global-settings'],
  { tags: ['global-settings'] }
);

export class SettingsService extends BaseService {
  constructor() {
    super('globalSetting');
  }

  async resolveProjectId(id) {
    if (!id) return 'default';
    
    // 1. Check if ID matches a Project
    const projectExists = await prisma.project.count({ where: { id } });
    if (projectExists > 0) return id;

    // 2. Check if ID matches a Website
    const website = await prisma.website.findUnique({ where: { id } });
    if (website && website.apiKey) {
      const project = await prisma.project.findUnique({ where: { apiKey: website.apiKey } });
      if (project) return project.id;
    }

    return id;
  }

  async getGlobalSettings(apiKey) {
    const data = await getCachedGlobalSettings(apiKey);
    if (!data) {
      throw new NotFoundError('Invalid API key');
    }
    return data;
  }

  async updateGlobalSettings(projectId, settingsToUpdate, userId) {
    const pId = projectId || 'default';

    let project = await prisma.project.findUnique({ where: { id: pId } });
    if (!project) {
      if (pId === 'default') {
        project = await prisma.project.create({
          data: {
            id: 'default',
            name: 'Default Project',
            apiKey: 'gbl_api_key_default_2024',
            status: 'active'
          }
        });
      } else {
        throw new NotFoundError('Project not found');
      }
    }

    const updateData = {};
    if (settingsToUpdate.brandColor !== undefined) updateData.brandColor = settingsToUpdate.brandColor;
    if (settingsToUpdate.maintenanceMode !== undefined) updateData.maintenanceMode = settingsToUpdate.maintenanceMode;
    if (settingsToUpdate.analytics !== undefined) updateData.analytics = settingsToUpdate.analytics;
    if (settingsToUpdate.cookieConsent !== undefined) updateData.cookieConsent = settingsToUpdate.cookieConsent;
    if (settingsToUpdate.formConsent !== undefined) updateData.formConsent = settingsToUpdate.formConsent;
    if (settingsToUpdate.privacyAccept !== undefined) updateData.privacyAccept = settingsToUpdate.privacyAccept;
    if (settingsToUpdate.marketingConsent !== undefined) updateData.marketingConsent = settingsToUpdate.marketingConsent;
    if (settingsToUpdate.logo !== undefined) updateData.logo = settingsToUpdate.logo;
    if (settingsToUpdate.favicon !== undefined) updateData.favicon = settingsToUpdate.favicon;

    const settings = await prisma.globalSetting.upsert({
      where: { projectId: project.id },
      update: updateData,
      create: { projectId: project.id, ...updateData },
    });

    revalidateTag('global-settings');

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'settings.updated',
        entity: 'GlobalSetting',
        entityId: settings.id,
        details: 'Global settings updated',
      },
    });

    return settings;
  }

  async getHeaderSettings(projectId) {
    const resolvedId = await this.resolveProjectId(projectId);
    const settings = await prisma.globalSetting.findUnique({ where: { projectId: resolvedId } });
    let headerSettings = {};
    try {
      headerSettings = settings?.headerSettings ? JSON.parse(settings.headerSettings) : {};
    } catch { /* ignore */ }
    return headerSettings;
  }

  async updateHeaderSettings(projectId, headerConfig, userId) {
    const resolvedId = await this.resolveProjectId(projectId);
    const settings = await prisma.globalSetting.upsert({
      where: { projectId: resolvedId },
      update: { headerSettings: JSON.stringify(headerConfig) },
      create: { projectId: resolvedId, headerSettings: JSON.stringify(headerConfig) },
    });

    revalidateTag('global-settings');

    await prisma.activityLog.create({
      data: { 
        userId, 
        action: 'settings.header_updated', 
        entity: 'GlobalSetting', 
        entityId: settings.id, 
        details: 'Header builder settings saved' 
      },
    });

    return headerConfig;
  }

  async getFooterSettings(projectId) {
    const resolvedId = await this.resolveProjectId(projectId);
    const settings = await prisma.globalSetting.findUnique({ where: { projectId: resolvedId } });
    let footerSettings = {};
    try {
      footerSettings = settings?.footerSettings ? JSON.parse(settings.footerSettings) : {};
    } catch { /* ignore */ }
    return footerSettings;
  }

  async updateFooterSettings(projectId, footerConfig, userId) {
    const resolvedId = await this.resolveProjectId(projectId);
    const settings = await prisma.globalSetting.upsert({
      where: { projectId: resolvedId },
      update: { footerSettings: JSON.stringify(footerConfig) },
      create: { projectId: resolvedId, footerSettings: JSON.stringify(footerConfig) },
    });

    revalidateTag('global-settings');

    await prisma.activityLog.create({
      data: { 
        userId, 
        action: 'settings.footer_updated', 
        entity: 'GlobalSetting', 
        entityId: settings.id, 
        details: 'Footer builder settings saved' 
      },
    });

    return footerConfig;
  }

  async getDashboardStats(projectId) {
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
      totalWebsites,
      activeWebsites,
      totalConnectedRoutes,
      totalApiRoutes,
      latestSync,
      recentWebsiteLogs,
    ] = await Promise.all([
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
      
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      
      prisma.formSubmission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      
      prisma.notification.count({ where: { projectId, isRead: false } }),
      
      prisma.lead.count({
        where: {
          projectId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      
      prisma.page.count({ where: { projectId, status: 'published' } }),
      
      prisma.page.count({ where: { projectId, status: 'draft' } }),
      
      prisma.service.count({ where: { projectId, isVisible: true } }),
      
      prisma.backup.count({ where: { projectId } }),
      
      prisma.media.count({ where: { projectId } }),
      
      prisma.user.count(),

      // Website Connector Stats
      prisma.website.count(),
      prisma.website.count({ where: { status: 'connected' } }),
      prisma.websiteRoute.count(),
      prisma.websiteRoute.count({ where: { routeType: 'api' } }),
      prisma.website.findFirst({
        orderBy: { lastSyncedAt: 'desc' },
        select: { lastSyncedAt: true }
      }),
      prisma.syncLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { website: { select: { name: true } } }
      }),
    ]);

    const recentNotifications = await prisma.notification.findMany({
      where: { projectId },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

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

    const recentBackups = await prisma.backup.findMany({
      where: { projectId },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    const lastBackup = recentBackups[0] || null;

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

    const formattedActivity = recentActivity.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      details: log.details,
      user: log.user?.name || log.user?.email || 'System',
      time: log.createdAt,
      timeAgo: this.getTimeAgo(log.createdAt),
    }));

    const formattedNotifications = recentNotifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      time: n.createdAt,
      timeAgo: this.getTimeAgo(n.createdAt),
    }));

    const formattedLeads = recentLeads.map((lead) => ({
      id: lead.id,
      name: lead.name || 'Anonymous',
      email: lead.email || '-',
      service: lead.serviceInterest || '-',
      status: lead.status,
      date: lead.createdAt.toISOString().split('T')[0],
    }));

    const formattedSubmissions = recentSubmissions.map((sub) => ({
      id: sub.id,
      name: sub.name || 'Anonymous',
      email: sub.email || '-',
      type: sub.formType,
      date: sub.createdAt.toISOString().split('T')[0],
      status: sub.status,
    }));

    const formattedTasks = upcomingTasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.scheduledAt?.toISOString().split('T')[0] || 'No date',
      status: task.status,
    }));

    return {
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
        totalWebsites,
        activeWebsites,
        totalConnectedRoutes,
        totalApiRoutes,
        lastSyncTime: latestSync?.lastSyncedAt || null,
      },
      websiteLogs: recentWebsiteLogs.map(log => ({
        id: log.id,
        websiteName: log.website?.name || 'Unknown Website',
        action: log.action,
        status: log.status,
        details: log.details,
        createdAt: log.createdAt,
        timeAgo: this.getTimeAgo(log.createdAt)
      })),
      recentActivity: formattedActivity,
      notifications: formattedNotifications,
      recentLeads: formattedLeads,
      recentSubmissions: formattedSubmissions,
      upcomingTasks: formattedTasks,
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
      profileCompletion: {
        percentage: profileCompletion,
        steps: profileSteps,
        completedSteps,
        totalSteps,
      },
    };
  }

  getTimeAgo(date) {
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
}

export const settingsService = new SettingsService();
export default settingsService;
