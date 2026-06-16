import { rateLimit } from 'express-rate-limit';

// Global rate limiting for all API endpoints to prevent abuse / DOS
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 150, // Limit each IP to 150 requests per 15-minute window
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
