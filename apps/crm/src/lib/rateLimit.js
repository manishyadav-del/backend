/**
 * Rate Limiter — in-memory Map-based request tracking.
 * Used to restrict brute force requests (e.g. on login/forgot-password).
 */

const tracker = new Map();

// Run simple garbage collector interval to keep map small
if (globalThis) {
  if (!globalThis.rateLimitCleanerRegistered) {
    globalThis.rateLimitCleanerRegistered = true;
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of tracker.entries()) {
        const filtered = value.filter(t => now - t < 15 * 60 * 1000); // 15 mins window max
        if (filtered.length === 0) {
          tracker.delete(key);
        } else {
          tracker.set(key, filtered);
        }
      }
    }, 5 * 60 * 1000); // clean every 5 mins
  }
}

/**
 * Checks request count for a given key (IP/UserId) within a rolling window.
 * @param {string} key
 * @param {number} limit
 * @param {number} windowMs
 * @returns {{ ok: boolean, remaining: number, reset: number }}
 */
export function rateLimit(key, limit = 60, windowMs = 60000) {
  const now = Date.now();
  
  if (!tracker.has(key)) {
    tracker.set(key, [now]);
    return { ok: true, remaining: limit - 1, reset: now + windowMs };
  }

  let timestamps = tracker.get(key);
  // Remove expired timestamps
  timestamps = timestamps.filter(t => now - t < windowMs);
  
  if (timestamps.length >= limit) {
    return {
      ok: false,
      remaining: 0,
      reset: timestamps[0] + windowMs
    };
  }

  timestamps.push(now);
  tracker.set(key, timestamps);

  return {
    ok: true,
    remaining: limit - timestamps.length,
    reset: timestamps[0] + windowMs
  };
}
