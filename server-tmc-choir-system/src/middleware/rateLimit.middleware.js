import { rateLimit } from 'express-rate-limit';

// Global rate limiting for all API endpoints to act as a safety net against
// abuse / DoS / scraping. A data-heavy admin SPA legitimately fans out many
// requests per page navigation, so the ceiling is generous and — crucially —
// successful (2xx/3xx) responses are NOT counted toward the limit. That means
// normal browsing never trips it, while bursts of *failing* requests (the
// signature of brute-force / probing / abuse) still get throttled. Sensitive
// endpoints keep their own stricter limiters (see loginLimiter / backupLimiter).
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Generous per-IP ceiling for legitimate dashboard use
  skipSuccessfulRequests: true, // Only count failed (4xx/5xx) responses
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again in 15 minutes!',
  },
  standardHeaders: true, // Return rate limit info in standard headers
  legacyHeaders: false, // Disable legacy X-RateLimit headers
});

// Strict limiter for the backup import endpoint: large, expensive, destructive
// operation that should only ever be run occasionally by an admin.
export const backupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5, // At most 5 import attempts per hour per IP
  message: {
    status: 'fail',
    message: 'Too many backup import attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting specifically for auth endpoints (e.g. login) to prevent brute-force attacks
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 login requests per 15-minute window
  message: {
    status: 'fail',
    message: 'Too many login attempts from this IP. Please try again in 15 minutes!',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
