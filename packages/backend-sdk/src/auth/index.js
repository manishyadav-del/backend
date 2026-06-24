import jwt from 'jsonwebtoken';

/**
 * Validates a synchronization JWT token sent from the Global Backend.
 * @param {string} token - The JWT token to validate.
 * @param {string} secret - The JWT secret key used for signing.
 * @returns {object|null} The decoded token payload if valid, otherwise null.
 */
export function validateSyncToken(token, secret) {
  try {
    if (!token) return null;
    
    // Support formats with or without "Bearer " prefix
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    return jwt.verify(cleanToken, secret);
  } catch (error) {
    console.error('[SDK Auth] Sync token validation failed:', error.message);
    return null;
  }
}

/**
 * Generates a verification signature or validates connection headers.
 * Useful for verifying domain and request origins.
 */
export function validateRequestOrigin(req, allowedDomain) {
  const host = req.headers['host'] || req.headers['x-forwarded-host'] || '';
  if (!host) return false;
  
  if (allowedDomain && !host.toLowerCase().includes(allowedDomain.toLowerCase())) {
    console.warn(`[SDK Auth] Request origin mismatch: Host '${host}' does not match allowed domain '${allowedDomain}'`);
    return false;
  }
  return true;
}
