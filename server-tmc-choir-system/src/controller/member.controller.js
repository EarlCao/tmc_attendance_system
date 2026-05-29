import { prisma } from '../lib/prisma.js';

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
    res.status(201).json({
      status: 'success',
      data: { member: formatMember(newMember) },
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
    res.status(200).json({
      status: 'success',
      data: { member: formatMember(updatedMember) },
    });
  } catch (err) {
    console.error('Update Member Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.member.delete({ where: { id: parseInt(id) } });
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
