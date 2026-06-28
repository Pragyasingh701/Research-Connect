/**
 * Custom in-memory rate limiter middleware to prevent brute-force attacks.
 */
const ipCache = new Map();

// Periodically clean up expired entries from the cache (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipCache.entries()) {
    if (now - data.windowStart > data.windowMs) {
      ipCache.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // Default: 15 minutes
  const max = options.max || 100; // Default: 100 requests per windowMs
  const message = options.message || 'Too many requests from this IP. Please try again later.';

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();

    if (!ipCache.has(ip)) {
      ipCache.set(ip, {
        windowStart: now,
        windowMs,
        requests: 0,
      });
    }

    const ipData = ipCache.get(ip);

    // If window has expired, reset the counter and window start time
    if (now - ipData.windowStart > windowMs) {
      ipData.windowStart = now;
      ipData.requests = 0;
    }

    ipData.requests += 1;

    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - ipData.requests)));
    res.set('X-RateLimit-Reset', String(new Date(ipData.windowStart + windowMs).getTime()));

    if (ipData.requests > max) {
      return res.status(429).json({
        status: 'fail',
        message,
      });
    }

    next();
  };
};

/**
 * Custom NoSQL Injection Protection middleware.
 * Recursively removes keys starting with '$' or containing '.' from request body, query, and params.
 */
const sanitizeObject = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else {
          sanitizeObject(obj[key]);
        }
      }
    }
  }
  return obj;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};
