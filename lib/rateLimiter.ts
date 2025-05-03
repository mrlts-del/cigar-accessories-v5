// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();

interface RateLimitOptions {
  limit: number;
  windowMs: number; // time window in milliseconds
}

export function rateLimit(ip: string, options: RateLimitOptions): boolean {
  const { limit, windowMs } = options;
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];

  // Remove timestamps outside the window
  const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);

  // Add the current request timestamp
  recentRequests.push(now);

  // Update the map
  rateLimiter.set(ip, recentRequests);

  // Check if the limit is exceeded
  return recentRequests.length > limit;
}

// Clean up old entries periodically (optional, but good practice for long-running processes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of rateLimiter.entries()) {
    const recentRequests = requests.filter(timestamp => now - timestamp < 60 * 60 * 1000); // Keep entries for 1 hour
    if (recentRequests.length === 0) {
      rateLimiter.delete(ip);
    } else {
      rateLimiter.set(ip, recentRequests);
    }
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes