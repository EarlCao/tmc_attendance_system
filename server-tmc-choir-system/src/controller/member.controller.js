import { prisma } from '../lib/prisma.js';

// Helper to map UI-friendly fields to Database fields and clean enums
const mapFrontendToDb = (body) => {
  const {
    name,
    fullName,
    voicePart,
    voiceType,
    course,
    yearLevel,
    status,
    religionDenomination,
    religion,
    email,
    emailOrFacebook,
    phone,
    contactNo,
    address,
    notes,
  } = body;

  const dbFullName = fullName || name;
  
  let dbVoiceType = voiceType || voicePart;
  if (dbVoiceType) {
    dbVoiceType = dbVoiceType.toUpperCase();
  }

  let dbStatus = status;
  if (dbStatus) {
    dbStatus = dbStatus.toUpperCase();
  }

  const dbContactNo = contactNo || phone;
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
      data: {
        members,
      },
    });
  } catch (err) {
    console.error('Get Members Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

export const createMember = async (req, res) => {
  try {
    const mappedData = mapFrontendToDb(req.body);

    if (!mappedData.fullName || !mappedData.voiceType || !mappedData.course || !mappedData.yearLevel || !mappedData.status) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide all required fields (fullName, voiceType, course, yearLevel, status)',
      });
    }

    const newMember = await prisma.member.create({
      data: mappedData,
    });

    res.status(201).json({
      status: 'success',
      data: {
        member: newMember,
      },
    });
  } catch (err) {
    console.error('Create Member Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.member.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    console.error('Delete Member Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const mappedData = mapFrontendToDb(req.body);

    const updatedMember = await prisma.member.update({
      where: { id: parseInt(id) },
      data: mappedData,
    });

    res.status(200).json({
      status: 'success',
      data: {
        member: updatedMember,
      },
    });
  } catch (err) {
    console.error('Update Member Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

export const searchMembers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a search query',
      });
    }

    const members = await prisma.member.findMany({
      where: {
        fullName: {
          contains: query,
        },
      },
      orderBy: { fullName: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      data: {
        members,
      },
    });
  } catch (err) {
    console.error('Search Members Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

export const filterMembers = async (req, res) => {
  try {
    const { voiceType, status } = req.query;

    const whereClause = {};
    if (voiceType) {
      whereClause.voiceType = voiceType;
    }
    if (status) {
      whereClause.status = status;
    }

    const members = await prisma.member.findMany({
      where: whereClause,
      orderBy: { fullName: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      data: {
        members,
      },
    });
  } catch (err) {
    console.error('Filter Members Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}