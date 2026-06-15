import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { emit } from '../socket/index.js';
import { createAuditLog } from '../lib/auditLogger.js';

// Normalize DB member record → frontend-friendly shape
const formatMember = (m) => {
  const nameParts = (m.fullName || '').trim().split(/\s+/);
  const lastName  = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ') || m.fullName || '';
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
    const passwordHash = await bcrypt.hash('tmc2026', 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: 'member',
        memberId: newMember.id,
      }
    });

    // Explicitly broadcast user:created so the Accounts panel refreshes
    const { passwordHash: _ph, ...safeUser } = newUser;
    emit('user:created', safeUser);

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
      data: { member: formatted },
    });
  } catch (err) {
    console.error('Create Member Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const mappedData = mapFrontendToDb(req.body);

    // Remove undefined fields
    Object.keys(mappedData).forEach(k => {
      if (mappedData[k] === undefined) delete mappedData[k];
    });

    const updatedMember = await prisma.member.update({
      where: { id: parseInt(id) },
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
    const { id } = req.params;

    // Find the member name before deleting for the audit log
    const member = await prisma.member.findUnique({ where: { id: parseInt(id) } });

    // Delete associated User(s) first to avoid FK constraint issues.
    const deletedUsers = await prisma.user.findMany({ where: { memberId: parseInt(id) } });
    await prisma.user.deleteMany({ where: { memberId: parseInt(id) } });
    deletedUsers.forEach(u => emit('user:deleted', { id: u.id }));

    await prisma.member.delete({ where: { id: parseInt(id) } });

    await createAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'DELETE_MEMBER',
      category: 'MEMBER',
      target: `member:${member?.fullName || id}`,
      details: { memberId: parseInt(id), linkedAccounts: deletedUsers.map(u => u.username) },
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
      where: { fullName: { contains: query } },
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
