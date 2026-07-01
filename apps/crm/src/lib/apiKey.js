/**
 * API Key Validation Helper
 * 
 * Used by SDK-facing endpoints to authenticate
 * external Next.js frontends via x-api-key header.
 */

import prisma from './prisma.js';

/**
 * Validate the API key from request headers and return the associated project
 * @param {Request} request
 * @returns {Promise<object|null>} project object or null if invalid
 */
export async function validateApiKey(requestOrKey) {
  let apiKey = typeof requestOrKey === 'string' ? requestOrKey : null;
  if (!apiKey && requestOrKey && typeof requestOrKey.headers?.get === 'function') {
    apiKey = requestOrKey.headers.get('x-api-key');
  }

  if (!apiKey) {
    return null;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { apiKey },
    });

    return project;
  } catch (err) {
    console.error('[validateApiKey] Database error:', err);
    return null;
  }
}

/**
 * Helper to create a 401 response for unauthorized requests
 * @param {string} [message='Unauthorized']
 * @returns {Response}
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return Response.json({ error: message }, { status: 401 });
}
