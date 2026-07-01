import { prisma } from './prisma.js';

export async function createNotification(projectId, type, title, message, link = null) {
  try {
    const notification = await prisma.notification.create({
      data: {
        projectId,
        type,
        title,
        message,
        isRead: false,
        link,
      },
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
