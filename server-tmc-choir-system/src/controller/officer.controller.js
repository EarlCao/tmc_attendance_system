import { prisma } from '../lib/prisma.js';

export const getOfficers = async (req, res) => {
  try {
    const officers = await prisma.officer.findMany({
      include: { member: true },
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
    const { memberId, position, duties, status } = req.body;

    if (!memberId || !position) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide memberId and position.',
      });
    }

    const newOfficer = await prisma.officer.create({
      data: {
        memberId: parseInt(memberId),
        position,
        duties: duties || null,
        status: status ? status.toUpperCase() : 'ACTIVE',
      },
      include: { member: true },
    });

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
    const { memberId, position, duties, status } = req.body;

    const data = {};
    if (memberId !== undefined) data.memberId = parseInt(memberId);
    if (position) data.position = position;
    if (duties !== undefined) data.duties = duties || null;
    if (status) data.status = status.toUpperCase();

    const updatedOfficer = await prisma.officer.update({
      where: { id: parseInt(id) },
      data,
      include: { member: true },
    });

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
