/**
 * Error Logger — writes to ErrorLog table in DB
 * Import and use in API route catch blocks
 */
import prisma from '@/lib/prisma.js';

/**
 * Custom Service Error classes
 */
export class ServiceError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ServiceError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends ServiceError {
  constructor(message) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends ServiceError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

export class AuthError extends ServiceError {
  constructor(message) {
    super(message, 401, 'UNAUTHORIZED');
  }
}

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
