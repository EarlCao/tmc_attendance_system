import { prisma } from '../lib/prisma.js';

export const getMembers = async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      orderBy: { name: 'asc' },
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
    const { name, voiceType, course, yearLevel, status, religion, emailOrFacebook, phone, address, notes } = req.body;

    if (!name || !voiceType || !course || !yearLevel || !status || !religion ) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide all required fields',
      });
    }

    const newMember = await prisma.member.create({
      data: {
        name,
        voiceType,
        course,
        yearLevel,
        status,
        religion,
        emailOrFacebook: emailOrFacebook,
        contactNo: phone,
        address,
        notes,
      },
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
    const { name, voiceType, course, yearLevel, status, religion, emailOrFacebook, phone, address, notes } = req.body;

    const updatedMember = await prisma.member.update({
      where: { id: parseInt(id) },
      data: {
        name,
        voiceType,
        course,
        yearLevel,
        status,
        religion,
        emailOrFacebook: emailOrFacebook,
        contactNo: phone,
        address,
        notes,
      },
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
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
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
      orderBy: { name: 'asc' },
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