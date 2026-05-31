import { prisma } from '../lib/prisma.js';
import { emit } from '../socket/index.js';

export const getOfficers = async (req, res) => {
  try {
    const { semesterId } = req.query;

    const whereClause = {};
    if (semesterId) {
      whereClause.semesterId = parseInt(semesterId);
    }

    const officers = await prisma.officer.findMany({
      where: whereClause,
      include: { semester: true },
      orderBy: { position: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      data: { officers },
    });
  } catch (err) {
    console.error('Get Officers Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const createOfficer = async (req, res) => {
  try {
    const { semesterId, fullName, position, contactNo, email, facebookAccount, dutiesNotes, status } = req.body;

    if (!semesterId || !fullName || !position) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide semesterId, fullName, and position.',
      });
    }

    const newOfficer = await prisma.officer.create({
      data: {
        semesterId: parseInt(semesterId),
        fullName,
        position,
        contactNo: contactNo || '',
        email: email || '',
        facebookAccount: facebookAccount || '',
        dutiesNotes: dutiesNotes || '',
        status: status ? status.toUpperCase() : 'ACTIVE',
      },
    });

    emit('officer:created', newOfficer);
    res.status(201).json({
      status: 'success',
      data: { officer: newOfficer },
    });
  } catch (err) {
    console.error('Create Officer Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const updateOfficer = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, position, contactNo, email, facebookAccount, dutiesNotes, status } = req.body;

    const data = {};
    if (fullName) data.fullName = fullName;
    if (position) data.position = position;
    if (contactNo !== undefined) data.contactNo = contactNo;
    if (email !== undefined) data.email = email;
    if (facebookAccount !== undefined) data.facebookAccount = facebookAccount;
    if (dutiesNotes !== undefined) data.dutiesNotes = dutiesNotes;
    if (status) data.status = status.toUpperCase();

    const updatedOfficer = await prisma.officer.update({
      where: { id: parseInt(id) },
      data,
    });

    emit('officer:updated', updatedOfficer);
    res.status(200).json({
      status: 'success',
      data: { officer: updatedOfficer },
    });
  } catch (err) {
    console.error('Update Officer Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const deleteOfficer = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.officer.delete({ where: { id: parseInt(id) } });

    emit('officer:deleted', { id: parseInt(id) });
    res.status(200).json({
      status: 'success',
      message: 'Officer deleted successfully',
      data: null,
    });
  } catch (err) {
    console.error('Delete Officer Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
