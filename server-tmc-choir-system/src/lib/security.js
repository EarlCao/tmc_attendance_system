import crypto from 'node:crypto';

// Centralized bcrypt cost factor (raised from the previous hardcoded 10).
export const BCRYPT_COST = 12;

// Minimum acceptable password length for account creation / password changes.
export const MIN_PASSWORD_LENGTH = 8;

// Canonical role values stored in the database. The middleware compares
// case-insensitively, but we always persist these exact strings.
export const ROLES = ['ADMIN', 'MEMBER'];

/**
 * Normalize a role string to a canonical value, or return null if invalid.
 * @param {string} role
 * @returns {string|null} 'ADMIN' | 'MEMBER' | null
 */
export const canonicalizeRole = (role) => {
  if (!role || typeof role !== 'string') return null;
  const upper = role.trim().toUpperCase();
  return ROLES.includes(upper) ? upper : null;
};

/**
 * Generate a random, URL-safe temporary password. Used for auto-created member
 * accounts instead of a shared hardcoded constant.
 * @param {number} bytes entropy in bytes (default 9 ≈ 12 chars base64url)
 * @returns {string}
 */
export const generateTempPassword = (bytes = 9) =>
  crypto.randomBytes(bytes).toString('base64url');
