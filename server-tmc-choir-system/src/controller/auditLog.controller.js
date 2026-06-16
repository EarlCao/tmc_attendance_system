import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../lib/auditLogger.js';

/**
 * GET /api/audit-logs
 * Query params:
 *   limit    - number of records to return (default 200, max 500)
 *   category - filter by category (AUTH, ACCOUNT, MEMBER, SEMESTER, SYSTEM)
 *   action   - filter by specific action
 *   search   - search by username or target
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { limit = 200, category, action, search } = req.query;

    const take = Math.min(parseInt(limit) || 200, 500);

    const where = {};
    if (category && category !== 'ALL') where.category = category;
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { target: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });

    res.status(200).json({
      status: 'success',
      data: { logs },
    });
  } catch (err) {
    console.error('Get Audit Logs Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

/**
 * DELETE /api/audit-logs
 * Clears all audit log entries (admin only, use with care).
 */
export const clearAuditLogs = async (req, res) => {
  try {
    const { count } = await prisma.auditLog.deleteMany({});
    // Clearing the trail is itself a security-relevant event — record who did it
    // and how many entries were removed so the action is never silent.
    await createAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'CLEAR_AUDIT_LOGS',
      category: 'SYSTEM',
      target: 'audit-logs',
      details: { clearedCount: count },
      ipAddress: req.ip,
    });
    res.status(200).json({ status: 'success', message: 'Audit logs cleared.' });
  } catch (err) {
    console.error('Clear Audit Logs Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
