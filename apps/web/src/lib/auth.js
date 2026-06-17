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

/**
 * Sign a JWT token for a user
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {string} signed JWT
 */
export function signToken(payload) {
  return jwt.sign(
    { id: payload.id, email: payload.email, role: payload.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {{ id: string, email: string, role: string } | null}
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
 * @returns {{ id: string, email: string, role: string } | null}
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
