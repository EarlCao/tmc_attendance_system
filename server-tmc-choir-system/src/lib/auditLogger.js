import { prisma } from './prisma.js';
import { emit } from '../socket/index.js';

/**
 * Creates an audit log entry and broadcasts it in real-time via Socket.IO.
 *
 * @param {object} opts
 * @param {number|null}  opts.userId     - ID of the user performing the action
 * @param {string|null}  opts.username   - Username snapshot at the time of action
 * @param {string}       opts.action     - Action key (LOGIN, LOGOUT, CREATE_MEMBER, etc.)
 * @param {string}       opts.category   - Category bucket (AUTH, ACCOUNT, MEMBER, SEMESTER, SYSTEM)
 * @param {string|null}  opts.target     - Human-readable target e.g. "user:john.doe"
 * @param {object|null}  opts.details    - Extra context (will be JSON-stringified)
 * @param {string|null}  opts.ipAddress  - Originating IP address
 */
export async function createAuditLog({
  userId = null,
  username = null,
  action,
  category = 'AUTH',
  target = null,
  details = null,
  ipAddress = null,
}) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId,
        username,
        action,
        category,
        target,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
      },
    });

    // Broadcast to all connected clients so the Audit Logs page updates live
    emit('auditLog:created', log);
    return log;
  } catch (err) {
    // Never crash the calling controller over a logging failure
    console.error('[AuditLogger] Failed to write audit log:', err);
  }
}
