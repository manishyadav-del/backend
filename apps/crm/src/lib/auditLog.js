import { prisma } from './prisma.js';

/**
 * Log an audit event in the database
 * @param {Object} params
 * @param {string} [params.userId] - The user performing the action
 * @param {string} params.action - The action name (e.g., LOGIN, USER_CREATION, etc.)
 * @param {string} [params.module] - The module affected (e.g., users, roles, pages)
 * @param {string} [params.ipAddress] - IP address of the request
 */
export async function logAuditEvent({ userId, action, module = null, ipAddress = null }) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
