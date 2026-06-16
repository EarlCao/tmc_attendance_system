import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { emit } from '../socket/index.js';
import { createAuditLog } from '../lib/auditLogger.js';
import { BCRYPT_COST, generateTempPassword, parseId } from '../lib/security.js';

// Common multi-word surname prefixes so names like "Dela Cruz" or "Van Der Berg"
// keep their full surname instead of only the final token (L-8).
const SURNAME_PREFIXES = new Set(['de', 'dela', 'del', 'della', 'di', 'van', 'von', 'der', 'den', 'da', 'dos', 'las', 'los', 'san', 'santa', 'st', 'mac', 'mc', 'la', 'le']);

// Normalize DB member record → frontend-friendly shape
const formatMember = (m) => {
  const nameParts = (m.fullName || '').trim().split(/\s+/).filter(Boolean);
  let firstName = m.fullName || '';
  let lastName = '';
  if (nameParts.length > 1) {
    // Walk from the end, absorbing recognized surname prefixes so compound
    // surnames are captured rather than truncated to a single token.
    let splitIndex = nameParts.length - 1;
    while (splitIndex > 1 && SURNAME_PREFIXES.has(nameParts[splitIndex - 1].toLowerCase())) {
      splitIndex--;
    }
    firstName = nameParts.slice(0, splitIndex).join(' ');
    lastName = nameParts.slice(splitIndex).join(' ');
  }
  const voicePart = m.voiceType
    ? m.voiceType.charAt(0).toUpperCase() + m.voiceType.slice(1).toLowerCase()
    : '';
  return {
    ...m,
    firstName,
    lastName,
    name: m.fullName,
    voicePart,
    email: m.emailOrFacebook || '',
    contactNumber: m.contactNo || '',
    status: (m.status || 'ACTIVE').toLowerCase(),
  };
};

// Map frontend payload → DB columns (handles both old and new field names)
const mapFrontendToDb = (body) => {
  const {
    firstName,
    lastName,
    name,
    fullName,
    voicePart,
    voiceType,
    course,
    yearLevel,
    status,
    religion,
    religionDenomination,
    email,
    emailOrFacebook,
    phone,
    contactNo,
    contactNumber,
    address,
    notes,
  } = body;

  // Resolve fullName from various possible inputs
  let dbFullName = fullName || name;
  if (!dbFullName && (firstName || lastName)) {
    dbFullName = `${firstName || ''} ${lastName || ''}`.trim();
  }

  let dbVoiceType = voiceType || voicePart;
  if (dbVoiceType) dbVoiceType = dbVoiceType.toUpperCase();

  let dbStatus = status;
  if (dbStatus) dbStatus = dbStatus.toUpperCase();

  const dbContactNo = contactNo || contactNumber || phone;
  const dbEmailOrFacebook = emailOrFacebook || email;
  const dbReligion = religion || religionDenomination;

  return {
    fullName: dbFullName,
    voiceType: dbVoiceType,
    course,
    yearLevel,
    status: dbStatus,
    religion: dbReligion,
    emailOrFacebook: dbEmailOrFacebook,
    contactNo: dbContactNo,
    address,
    notes,
  };
};

export const getMembers = async (req, res) => {
  try {
    // Opt-in, backward-compatible pagination: only applied when ?page or
    // ?pageSize is provided. Without them the full array is returned as before.
    const { page, pageSize } = req.query;
    if (page !== undefined || pageSize !== undefined) {
      const pageNum = parseId(page) || 1;
      const size = Math.min(parseId(pageSize) || 25, 200);
      const [members, total] = await Promise.all([
        prisma.member.findMany({
          orderBy: { fullName: 'asc' },
          skip: (pageNum - 1) * size,
          take: size,
        }),
        prisma.member.count(),
      ]);
      return res.status(200).json({
        status: 'success',
        data: {
          members: members.map(formatMember),
          pagination: { page: pageNum, pageSize: size, total, totalPages: Math.ceil(total / size) },
        },
      });
    }

    const members = await prisma.member.findMany({
      orderBy: { fullName: 'asc' },
    });
    res.status(200).json({
      status: 'success',
      data: { members: members.map(formatMember) },
    });
  } catch (err) {
    console.error('Get Members Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const createMember = async (req, res) => {
  try {
    const mappedData = mapFrontendToDb(req.body);

    if (!mappedData.fullName || !mappedData.voiceType) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a name and voice part.',
      });
    }

    // Default required enum fields
    if (!mappedData.status) mappedData.status = 'ACTIVE';
    // Remove undefined/null optional fields to avoid Prisma issues
    Object.keys(mappedData).forEach(k => {
      if (mappedData[k] === undefined) delete mappedData[k];
    });

    const newMember = await prisma.member.create({ data: mappedData });

    // Auto-create a linked User account for this member
    const baseUsername = newMember.fullName.toLowerCase().replace(/\s+/g, '.');
    let username = baseUsername;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    // Generate a unique random temporary password instead of a shared constant.
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_COST);
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: 'MEMBER',
        memberId: newMember.id,
      }
    });

    // The socket-aware Prisma extension already emits `user:created` on
    // prisma.user.create, so no manual emit is needed here (avoids duplicates).

    await createAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'CREATE_MEMBER',
      category: 'MEMBER',
      target: `member:${newMember.fullName}`,
      details: { memberId: newMember.id, voiceType: newMember.voiceType, autoAccount: username },
      ipAddress: req.ip,
    });

    const formatted = formatMember(newMember);
    res.status(201).json({
      status: 'success',
      // Return the generated credentials once so the admin can hand them over.
      // The password is not stored anywhere in plaintext.
      data: { member: formatted, account: { username, tempPassword } },
    });
  } catch (err) {
    console.error('Create Member Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const updateMember = async (req, res) => {
  try {
    const memberId = parseId(req.params.id);
    if (!memberId) return res.status(400).json({ status: 'fail', message: 'Invalid member id.' });
    const mappedData = mapFrontendToDb(req.body);

    // Remove undefined fields
    Object.keys(mappedData).forEach(k => {
      if (mappedData[k] === undefined) delete mappedData[k];
    });

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: mappedData,
    });

    await createAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'UPDATE_MEMBER',
      category: 'MEMBER',
      target: `member:${updatedMember.fullName}`,
      details: { memberId: updatedMember.id, changes: Object.keys(mappedData) },
      ipAddress: req.ip,
    });

    const formatted = formatMember(updatedMember);
    res.status(200).json({
      status: 'success',
      data: { member: formatted },
    });
  } catch (err) {
    console.error('Update Member Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const deleteMember = async (req, res) => {
  try {
    const memberId = parseId(req.params.id);
    if (!memberId) return res.status(400).json({ status: 'fail', message: 'Invalid member id.' });

    // Find the member name before deleting for the audit log
    const member = await prisma.member.findUnique({ where: { id: memberId } });

    // Collect linked users up-front so we can broadcast their removal afterwards.
    const deletedUsers = await prisma.user.findMany({ where: { memberId } });

    // Delete all dependent rows then the member itself, atomically. Attendance
    // and officer rows have no ON DELETE CASCADE, so they must be removed first
    // or the member delete fails with a foreign-key violation.
    await prisma.$transaction([
      prisma.attendanceRecord.deleteMany({ where: { memberId } }),
      prisma.officer.deleteMany({ where: { memberId } }),
      prisma.user.deleteMany({ where: { memberId } }),
      prisma.member.delete({ where: { id: memberId } }),
    ]);

    deletedUsers.forEach(u => emit('user:deleted', { id: u.id }));

    await createAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'DELETE_MEMBER',
      category: 'MEMBER',
      target: `member:${member?.fullName || memberId}`,
      details: { memberId, linkedAccounts: deletedUsers.map(u => u.username) },
      ipAddress: req.ip,
    });

    res.status(200).json({ status: 'success', data: null });
  } catch (err) {
    console.error('Delete Member Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const searchMembers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ status: 'fail', message: 'Please provide a search query' });
    }
    const members = await prisma.member.findMany({
      where: { fullName: { contains: query, mode: 'insensitive' } },
      orderBy: { fullName: 'asc' },
    });
    res.status(200).json({
      status: 'success',
      data: { members: members.map(formatMember) },
    });
  } catch (err) {
    console.error('Search Members Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const filterMembers = async (req, res) => {
  try {
    const { voiceType, status } = req.query;
    const whereClause = {};
    if (voiceType) whereClause.voiceType = voiceType.toUpperCase();
    if (status) whereClause.status = status.toUpperCase();
    const members = await prisma.member.findMany({
      where: whereClause,
      orderBy: { fullName: 'asc' },
    });
    res.status(200).json({
      status: 'success',
      data: { members: members.map(formatMember) },
    });
  } catch (err) {
    console.error('Filter Members Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
