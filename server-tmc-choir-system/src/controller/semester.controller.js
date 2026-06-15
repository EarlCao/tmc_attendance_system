import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../lib/auditLogger.js';

export const getSemesters = async (req, res) => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: [
        { startDate: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    });
    const now = new Date();
    const formattedSemesters = semesters.map(semester => {
      let status = 'archived';
      if (semester.startDate && (!semester.endDate || semester.endDate > now)) {
        status = 'active';
      }
      return { ...semester, status };
    });

    res.status(200).json({
      status: 'success',
      data: { semesters: formattedSemesters },
    });
  } catch (err) {
    console.error('Get Semesters Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const createSemester = async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    if (!name || !startDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name and start date.',
      });
    }

    const newSemester = await prisma.semester.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'CREATE_SEMESTER',
      category: 'SEMESTER',
      target: `semester:${name}`,
      details: { semesterId: newSemester.id, startDate, endDate: endDate || null },
      ipAddress: req.ip,
    });

    res.status(201).json({
      status: 'success',
      data: { semester: newSemester },
    });
  } catch (err) {
    console.error('Create Semester Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const updateSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    const updatedSemester = await prisma.semester.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    await createAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'UPDATE_SEMESTER',
      category: 'SEMESTER',
      target: `semester:${updatedSemester.name}`,
      details: { semesterId: updatedSemester.id, changes: Object.keys(updateData) },
      ipAddress: req.ip,
    });

    res.status(200).json({
      status: 'success',
      data: { semester: updatedSemester },
    });
  } catch (err) {
    console.error('Update Semester Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const endSemester = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedSemester = await prisma.semester.update({
      where: { id: parseInt(id) },
      data: { endDate: new Date() },
    });

    await createAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'END_SEMESTER',
      category: 'SEMESTER',
      target: `semester:${updatedSemester.name}`,
      details: { semesterId: updatedSemester.id, endedAt: new Date().toISOString() },
      ipAddress: req.ip,
    });

    res.status(200).json({
      status: 'success',
      data: { semester: updatedSemester },
    });
  } catch (err) {
    console.error('End Semester Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;

    const semester = await prisma.semester.findUnique({ where: { id: parseInt(id) } });

    await prisma.semester.delete({ where: { id: parseInt(id) } });

    await createAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action: 'DELETE_SEMESTER',
      category: 'SEMESTER',
      target: `semester:${semester?.name || id}`,
      details: { semesterId: parseInt(id) },
      ipAddress: req.ip,
    });

    res.status(200).json({
      status: 'success',
      message: 'Semester deleted successfully',
      data: null,
    });
  } catch (err) {
    console.error('Delete Semester Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
