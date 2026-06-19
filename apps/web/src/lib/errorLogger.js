/**
 * Error Logger — writes to ErrorLog table in DB
 * Import and use in API route catch blocks
 */
import prisma from '@/lib/prisma.js';

/**
 * @param {string} message
 * @param {string|null} stack
 * @param {string|null} url
 * @param {'error'|'warn'|'info'} level
 * @param {string|null} projectId
 * @param {string|null} userId
 */
export async function logError(message, stack = null, url = null, level = 'error', projectId = null, userId = null) {
  try {
    await prisma.errorLog.create({
      data: { message: String(message).slice(0, 2000), stack: stack ? String(stack).slice(0, 5000) : null, url, level, projectId, userId },
    });
  } catch {
    // Silent fail — don't crash the app if logging fails
  }
}
