/**
 * JWT Authentication Helpers
 * 
 * Used for dashboard login sessions.
 * - signToken: creates a JWT for a user
 * - verifyToken: validates and decodes a JWT
 * - getAuthUser: extracts user from request cookies/headers
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

import { prisma } from './prisma.js';

/**
 * Resolve all roles assigned to a user
 * @param {string} userId 
 * @returns {Promise<string[]>} array of role names
 */
export async function resolveUserRoles(userId) {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map(ur => ur.role.name);
  } catch (error) {
    console.error('Error resolving user roles:', error);
    return [];
  }
}

/**
 * Resolve all permissions for a user (combining roles + overrides)
 * @param {string} userId 
 * @returns {Promise<string[]>} array of permission strings like 'pages.view'
 */
export async function resolveUserPermissions(userId) {
  try {
    // 1. Fetch user's roles and permissions
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    const permissionsMap = {};

    // Map role-based permissions
    for (const ur of userRoles) {
      if (ur.role?.permissions) {
        for (const rp of ur.role.permissions) {
          if (rp.permission) {
            const key = `${rp.permission.module}.${rp.permission.action}`;
            permissionsMap[key] = true;
          }
        }
      }
    }

    // 2. Fetch user-level permission overrides
    const overrides = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true }
    });

    for (const ov of overrides) {
      if (ov.permission) {
        const key = `${ov.permission.module}.${ov.permission.action}`;
        if (ov.value === true) {
          permissionsMap[key] = true;
        } else {
          delete permissionsMap[key];
        }
      }
    }

    return Object.keys(permissionsMap);
  } catch (error) {
    console.error('Error resolving user permissions:', error);
    return [];
  }
}

/**
 * Helper to check if a user has a specific permission
 * @param {string[]} userPermissions 
 * @param {string} requiredPermission 
 * @returns {boolean}
 */
export function hasPermission(userPermissions = [], requiredPermission) {
  if (!userPermissions) return false;
  return userPermissions.includes(requiredPermission);
}

/**
 * Sign a JWT token for a user
 * @param {{ id: string, email: string, role: string, permissions?: string[] }} payload
 * @returns {string} signed JWT
 */
export function signToken(payload) {
  return jwt.sign(
    { 
      id: payload.id, 
      email: payload.email, 
      role: payload.role, 
      permissions: payload.permissions || [] 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {{ id: string, email: string, role: string, permissions: string[] } | null}
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user from a Next.js request
 * Checks Authorization header first, then auth-token cookie
 * @param {Request} request
 * @returns {{ id: string, email: string, role: string, permissions: string[] } | null}
 */
export function getAuthUser(request) {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return verifyToken(token);
  }

  // Check cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/auth-token=([^;]+)/);
  if (match) {
    return verifyToken(match[1]);
  }

  return null;
}

export const permissions = {
  admin: {
    dashboard: ['read', 'write'],
    users: ['read', 'write'],
    security: ['read', 'write'],
    settings: ['read', 'write'],
    services: ['read', 'write'],
    content: ['read', 'write'],
    leads: ['read', 'write'],
  },
  manager: {
    dashboard: ['read', 'write'],
    users: [],
    security: [],
    settings: ['read'], 
    services: ['read', 'write'],
    content: ['read', 'write'],
    leads: ['read', 'write'],
  },
  editor: {
    dashboard: ['read', 'write'],
    users: [],
    security: [],
    settings: [],
    services: ['read'], 
    content: ['read', 'write'],
    leads: ['read'], 
  },
  viewer: {
    dashboard: ['read'],
    users: [],
    security: [],
    settings: [],
    services: ['read'],
    content: ['read'],
    leads: ['read'],
  }
};

export function checkPermission(role, resource, action) {
  const rolePerms = permissions[role];
  if (!rolePerms) return false;
  
  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;
  
  return resourcePerms.includes(action);
}

export function getRequiredResourceForPath(pathname) {
  if (pathname === '/dashboard' || pathname === '/user-dashboard') {
    return 'dashboard';
  }
  
  if (pathname.startsWith('/dashboard/users')) {
    return 'users';
  }
  
  if (
    pathname.startsWith('/dashboard/security') || 
    pathname.startsWith('/dashboard/login-history') || 
    pathname.startsWith('/dashboard/backup') || 
    pathname.startsWith('/dashboard/dev-tools') || 
    pathname.startsWith('/dashboard/performance')
  ) {
    return 'security';
  }
  
  if (
    pathname.startsWith('/dashboard/email') || 
    pathname.startsWith('/dashboard/header-builder') || 
    pathname.startsWith('/dashboard/footer-builder') || 
    pathname.startsWith('/dashboard/navigation') || 
    pathname.startsWith('/dashboard/redirects') ||
    pathname.startsWith('/dashboard/services')
  ) {
    return 'services';
  }
  
  if (
    pathname.startsWith('/dashboard/leads') || 
    pathname.startsWith('/dashboard/forms') || 
    pathname.startsWith('/dashboard/contacts') || 
    pathname.startsWith('/dashboard/analytics') || 
    pathname.startsWith('/dashboard/live')
  ) {
    return 'leads';
  }
  
  return 'content';
}
